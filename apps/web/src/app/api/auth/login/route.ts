import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { comparePassword, signToken, COOKIE_NAME } from '@/lib/auth'
import { loginSchema } from '@/lib/validators/auth'
import { errorResponse } from '@/lib/api-response'
import { Role } from '@/types'
import { compare } from 'bcryptjs'

// ---------------------------------------------------------------------------
// Fallback demo users (used when Supabase DB is unreachable)
// All use password: Admin@123
// Hash: $2a$10$xN3VBhCNH5ta9MJf4Chz0ejMhwjVqOAcyFgYS1ukGrZ0f.u2Qey1y
// ---------------------------------------------------------------------------
const DEMO_PASSWORD_HASH = '$2a$10$xN3VBhCNH5ta9MJf4Chz0ejMhwjVqOAcyFgYS1ukGrZ0f.u2Qey1y'

const FALLBACK_USERS: Record<string, {
  id: string
  name: string
  email: string
  passwordHash: string
  role: string
  status: string
  approvalStatus: string
  onboardingCompleted: boolean
  gymId: string | null
  gym: null
  ownedGyms: { id: string; name: string }[]
}> = {
  'aditipkadam11@gmail.com': {
    id: 'owner-001',
    name: 'Aditi Kadam',
    email: 'aditipkadam11@gmail.com',
    passwordHash: DEMO_PASSWORD_HASH,
    role: 'GYM_OWNER',
    status: 'ACTIVE',
    approvalStatus: 'APPROVED',
    onboardingCompleted: true,
    gymId: 'gym-001',
    gym: null,
    ownedGyms: [{ id: 'gym-001', name: 'VyayamAI Gym' }],
  },
  'admin@gymadmin.com': {
    id: 'owner-002',
    name: 'Demo Admin',
    email: 'admin@gymadmin.com',
    passwordHash: DEMO_PASSWORD_HASH,
    role: 'GYM_OWNER',
    status: 'ACTIVE',
    approvalStatus: 'APPROVED',
    onboardingCompleted: true,
    gymId: 'gym-001',
    gym: null,
    ownedGyms: [{ id: 'gym-001', name: 'VyayamAI Gym' }],
  },
  'admin@macromate.com': {
    id: 'admin-001',
    name: 'System Admin',
    email: 'admin@macromate.com',
    passwordHash: DEMO_PASSWORD_HASH,
    role: 'ADMIN',
    status: 'ACTIVE',
    approvalStatus: 'APPROVED',
    onboardingCompleted: true,
    gymId: 'gym-001',
    gym: null,
    ownedGyms: [],
  },
  'trainer@macromate.com': {
    id: 'trainer-001',
    name: 'Demo Trainer',
    email: 'trainer@macromate.com',
    passwordHash: DEMO_PASSWORD_HASH,
    role: 'TRAINER',
    status: 'ACTIVE',
    approvalStatus: 'APPROVED',
    onboardingCompleted: true,
    gymId: 'gym-001',
    gym: null,
    ownedGyms: [],
  },
  'client@macromate.com': {
    id: 'client-001',
    name: 'Demo Client',
    email: 'client@macromate.com',
    passwordHash: DEMO_PASSWORD_HASH,
    role: 'CLIENT',
    status: 'ACTIVE',
    approvalStatus: 'APPROVED',
    onboardingCompleted: true,
    gymId: 'gym-001',
    gym: null,
    ownedGyms: [],
  },
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate input
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {}
      for (const issue of parsed.error.issues) {
        const field = issue.path.join('.')
        if (!fieldErrors[field]) fieldErrors[field] = []
        fieldErrors[field].push(issue.message)
      }
      return errorResponse('Validation failed', 422, fieldErrors)
    }

    const { email, password } = parsed.data
    const normalizedEmail = email.toLowerCase().trim()

    // -------------------------------------------------------------------------
    // Try Prisma / Supabase first; fall back to demo users on any DB error
    // -------------------------------------------------------------------------
    let user: typeof FALLBACK_USERS[string] | null = null
    let usedFallback = false

    try {
      const dbUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
        include: {
          gym: true,
          ownedGyms: true,
        },
      })
      if (dbUser) {
        user = {
          id: dbUser.id,
          name: dbUser.name,
          email: dbUser.email,
          passwordHash: dbUser.passwordHash,
          role: dbUser.role,
          status: dbUser.status,
          approvalStatus: (dbUser as any).approvalStatus ?? 'APPROVED',
          onboardingCompleted: (dbUser as any).onboardingCompleted ?? true,
          gymId: dbUser.gymId ?? null,
          gym: null,
          ownedGyms: (dbUser as any).ownedGyms ?? [],
        }
      }
    } catch (dbErr: any) {
      console.warn('⚠️  Supabase unreachable, using fallback demo users:', dbErr.message)
      usedFallback = true
      user = FALLBACK_USERS[normalizedEmail] ?? null
    }

    // If DB succeeded but user not found, also check fallback demo users
    if (!user && !usedFallback) {
      user = FALLBACK_USERS[normalizedEmail] ?? null
      if (user) usedFallback = true
    }

    // 1. User not found
    if (!user || (user as any).isDeleted) {
      return NextResponse.json(
        {
          success: false,
          code: 'USER_NOT_FOUND',
          message: 'No account found. Please create an account first.',
        },
        { status: 404 }
      )
    }

    // 2. Verify password
    const isValid = await compare(password, user.passwordHash)
    if (!isValid) {
      return errorResponse('Invalid password. Please check your credentials.', 401)
    }

    // 3. Check account status
    if (user.status === 'SUSPENDED') {
      return NextResponse.json(
        {
          success: false,
          redirectUrl: '/access-denied',
          message: 'Account has been suspended. Please contact support.',
        },
        { status: 403 }
      )
    }

    // 4. Determine redirect destination
    let redirectUrl = '/dashboard'
    const isOnboardingDone = Boolean(user.onboardingCompleted)
    const approvalStatus = user.approvalStatus || 'APPROVED'

    if (!isOnboardingDone) {
      redirectUrl = '/onboarding'
    } else if (approvalStatus === 'PENDING') {
      redirectUrl = '/pending-approval'
    }

    const gymId = user.gymId || (user.ownedGyms && user.ownedGyms.length > 0 ? user.ownedGyms[0].id : null)

    // 5. Generate JWT
    const token = await signToken({
      userId: user.id,
      email: user.email,
      role: user.role as Role,
      name: user.name,
      gymId,
      onboardingCompleted: isOnboardingDone,
      approvalStatus,
      status: user.status,
    })

    // 6. Build response (omit password hash)
    const { passwordHash: _, ...safeUser } = user

    const response = NextResponse.json(
      {
        success: true,
        data: {
          user: safeUser,
          token,
          redirectUrl,
          fallback: usedFallback,
        },
        message: 'Login successful',
      },
      { status: 200 }
    )

    const isHttps =
      request.nextUrl.protocol === 'https:' ||
      request.headers.get('x-forwarded-proto') === 'https'

    // Set HTTP-only cookie
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: isHttps,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    })

    return response
  } catch (error) {
    console.error('Login error:', error)
    return errorResponse('Internal server error', 500)
  }
}
