import {
  INestApplication,
  ValidationPipe,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AuthController } from '../../src/auth/auth.controller';
import { AuthService } from '../../src/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { createUser } from '../factory/userFactory';
import { User, UserRole } from '../../src/users/users.schema';
import { SignupDto } from 'src/auth/dto/signupDto';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let authService: AuthService;
  let jwtService: JwtService;

  // Mock user for testing
  const mockUser: User = createUser({
    _id: '1',
    name: 'John Doe',
    email: 'john@mail.com',
    password: '123456',
    role: UserRole.NORMAL,
  });

  // Mock JWT token
  const mockToken = 'mock.jwt.token';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            signin: jest.fn().mockImplementation((email, password) => {
              if (email === mockUser.email && password === mockUser.password) {
                return Promise.resolve({ accessToken: mockToken });
              }
              throw new UnauthorizedException();
            }),
            signup: jest.fn().mockImplementation((name, email, password) => {
              if (email === mockUser.email) {
                throw new Error('User already exists');
              }
              return Promise.resolve({
                accessToken: mockToken,
              });
            }),
            profile: jest.fn().mockImplementation((userId) => {
              if (userId === mockUser._id) {
                return Promise.resolve({
                  _id: mockUser._id,
                  name: mockUser.name,
                  email: mockUser.email,
                  role: mockUser.role,
                });
              }
              return Promise.resolve(null);
            }),
          },
        },
        {
          provide: JwtService,
          useValue: {
            signAsync: jest.fn().mockResolvedValue(mockToken),
            verifyAsync: jest.fn().mockImplementation((token) => {
              if (token === mockToken) {
                return Promise.resolve({ sub: mockUser._id });
              }
              throw new Error('Invalid token');
            }),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    authService = moduleFixture.get<AuthService>(AuthService);
    jwtService = moduleFixture.get<JwtService>(JwtService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should return JWT token when credentials are valid', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: mockUser.email, password: '123456' })
        .expect(200)
        .expect((res) => {
          expect(res.body.accessToken).toBe(mockToken);
          expect(authService.signin).toHaveBeenCalledWith(
            mockUser.email,
            '123456',
          );
        });
    });

    it('should return 401 when credentials are invalid', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'invalid@mail.com', password: 'wrongpassword' })
        .expect(401);
    });

    it('should return 400 when email is missing', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: '123456' })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('email should not be empty');
        });
    });

    it('should return 400 when password is missing', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: mockUser.email })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('password should not be empty');
        });
    });

    it('should return 400 when email is invalid format', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'not-an-email', password: '123456' })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('email must be an email');
        });
    });
  });

  describe('POST /auth/register', () => {
    it('should create a new user and return JWT token', () => {
      const signupDto: SignupDto = {
        name: 'New User',
        email: 'new.user@mail.com',
        password: 'password123',
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(signupDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.accessToken).toBe(mockToken);
          expect(authService.signup).toHaveBeenCalledWith(
            signupDto.name,
            signupDto.email,
            signupDto.password,
          );
        });
    });

    it('should return 400 when name is missing', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'new.user@mail.com', password: 'password123' })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('name should not be empty');
        });
    });

    it('should return 400 when email is missing', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'New User', password: 'password123' })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('email should not be empty');
        });
    });

    it('should return 400 when password is missing', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'New User', email: 'new.user@mail.com' })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('password should not be empty');
        });
    });

    it('should return 400 when email is invalid format', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'New User',
          email: 'not-an-email',
          password: 'password123',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('email must be an email');
        });
    });

    it('should return 400 when password is too short', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'New User',
          email: 'new.user@mail.com',
          password: '12345',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'password must be longer than or equal to 6 characters',
          );
        });
    });
  });

  describe('GET /auth/profile', () => {
    it('should return the user profile when authenticated', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBe(mockUser._id);
          expect(res.body.name).toBe(mockUser.name);
          expect(res.body.email).toBe(mockUser.email);
        });
    });

    it('should return 401 when no token is provided', () => {
      return request(app.getHttpServer()).get('/auth/profile').expect(401);
    });

    it('should return 401 when invalid token is provided', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });
  });
});
