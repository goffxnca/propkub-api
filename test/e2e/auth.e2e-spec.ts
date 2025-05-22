import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { User, UserRole } from '../../src/users/users.schema';
import { SignupDto } from '../../src/auth/dto/signupDto';
import {
  rootMongooseTestModule,
  closeMongodConnection,
} from '../utils/mongodb-memory';
import { AuthModule } from '../../src/auth/auth.module';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from '../../src/users/users.service';
import { ConfigModule } from '@nestjs/config';
import { MailService } from '../../src/mail/mail.service';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let userModel: Model<User>;
  let usersService: UsersService;
  let mailService: MailService;

  const testUser = {
    name: 'John Doe',
    email: 'john@test.com',
    password: 'password123',
    role: UserRole.NORMAL,
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        rootMongooseTestModule(),
        AuthModule,
      ],
    })
      .overrideProvider(MailService)
      .useValue({
        sendEmail: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));
    usersService = moduleFixture.get<UsersService>(UsersService);
    mailService = moduleFixture.get<MailService>(MailService);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await closeMongodConnection();
  });

  describe('POST /auth/register', () => {
    it('should create a new user and return JWT token', () => {
      const signupDto: SignupDto = {
        name: testUser.name,
        email: testUser.email,
        password: testUser.password,
      };

      return request(app.getHttpServer())
        .post('/auth/register')
        .send(signupDto)
        .expect(201)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.accessToken).toContain('eyJhb');
        });
    });

    it('should return 409 when email already exists', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Duplicate User',
          email: testUser.email,
          password: testUser.password,
        })
        .expect(409);
    });

    it('should return 400 when name is missing', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'new.user2@test.com', password: testUser.password })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('name should not be empty');
        });
    });

    it('should return 400 when email is missing', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'New User', password: testUser.password })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('email should not be empty');
        });
    });

    it('should return 400 when password is missing', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'New User', email: 'new.user3@test.com' })
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
          password: testUser.password,
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
          email: 'new.user4@test.com',
          password: '1234567',
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'password must be longer than or equal to 8 characters',
          );
        });
    });
  });

  describe('POST /auth/login', () => {
    it('should return JWT token when credentials are valid', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      expect(response.body.accessToken).toBeDefined();
      expect(response.body.accessToken).toContain('eyJhb');
    });

    it('should return 401 when credentials are invalid', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: 'wrongpassword' })
        .expect(401);
    });

    it('should return 400 when email is missing', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ password: testUser.password })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('email should not be empty');
        });
    });

    it('should return 400 when password is missing', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('password should not be empty');
        });
    });

    it('should return 400 when email is invalid format', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'not-an-email', password: testUser.password })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('email must be an email');
        });
    });
  });

  describe('GET /auth/profile', () => {
    it('should return the user profile when authenticated', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: testUser.email, password: testUser.password })
        .expect(200);

      const accessToken = response.body.accessToken;
      expect(accessToken).toBeDefined();

      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.name).toBe(testUser.name);
          expect(res.body.email).toBe(testUser.email);
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

  describe('POST /auth/forgot-password', () => {
    beforeEach(async () => {
      jest.clearAllMocks();
    });

    it('should create a password reset token for existing user', async () => {
      const createTokenSpy = jest.spyOn(
        usersService,
        'createPasswordResetToken',
      );
      const sendEmailSpy = jest.spyOn(mailService, 'sendEmail');

      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: testUser.email })
        .expect(200);

      expect(response.body.message).toBe(
        'If the email exists, a password reset link has been sent',
      );
      expect(createTokenSpy).toHaveBeenCalledWith(testUser.email);
      expect(sendEmailSpy).toHaveBeenCalled();

      const user = await userModel.findOne({ email: testUser.email });
      expect(user).not.toBeNull();
      expect(user?.passwordResetToken).toBeDefined();
      expect(user?.passwordResetExpires).toBeDefined();
    });

    it('should return same response for non-existent email', async () => {
      const createTokenSpy = jest.spyOn(
        usersService,
        'createPasswordResetToken',
      );
      const sendEmailSpy = jest.spyOn(mailService, 'sendEmail');

      const response = await request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'nonexist@user.com' })
        .expect(200);

      expect(response.body.message).toBe(
        'If the email exists, a password reset link has been sent',
      );
      expect(createTokenSpy).toHaveBeenCalledWith('nonexist@user.com');
      expect(sendEmailSpy).not.toHaveBeenCalled();
    });

    it('should return 400 when email is missing', async () => {
      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({})
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('email should not be empty');
        });
    });

    it('should return 400 when email format is invalid', async () => {
      return request(app.getHttpServer())
        .post('/auth/forgot-password')
        .send({ email: 'not-an-email' })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('email must be an email');
        });
    });
  });
});
