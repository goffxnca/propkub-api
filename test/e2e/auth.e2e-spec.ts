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

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let userModel: Model<User>;
  let usersService: UsersService;

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
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));
    usersService = moduleFixture.get<UsersService>(UsersService);
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
});
