import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { UsersController } from '../../src/users/users.controller';
import { UsersService } from '../../src/users/users.service';
import { User, UserRole } from '../../src/users/users.schema';
import { createUser } from '../factory/userFactory';

describe('Users (e2e)', () => {
  let app: INestApplication;
  let service: UsersService;

  // Create mock users for testing
  const mockUsers: User[] = [
    createUser({
      _id: '1',
      name: 'John Doe',
      email: 'john.doe@example.com',
      role: UserRole.NORMAL,
    }) as User,
    createUser({
      _id: '2',
      name: 'Jane Smith',
      email: 'jane.smith@example.com',
      role: UserRole.AGENT,
    }) as User,
    createUser({
      _id: '3',
      name: 'Jeff Foo',
      email: 'jeff@example.com',
      role: UserRole.AGENT,
    }) as User,
  ];

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        {
          provide: UsersService,
          useValue: {
            getMe: jest.fn().mockImplementation(() => {
              return Promise.resolve(mockUsers[0]);
            }),
            updateMe: jest.fn().mockImplementation((updateData) => {
              const updatedUser = { ...mockUsers[0], ...updateData };
              return Promise.resolve(updatedUser);
            }),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    service = moduleFixture.get<UsersService>(UsersService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /users/me', () => {
    it('should return the current user profile', () => {
      return request(app.getHttpServer())
        .get('/users/me')
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body._id).toBe(mockUsers[0]._id);
          expect(res.body.name).toBe(mockUsers[0].name);
          expect(res.body.email).toBe(mockUsers[0].email);
          expect(res.body.role).toBe(mockUsers[0].role);
        });
    });

    it('should return 404 when user not found', async () => {
      jest.spyOn(service, 'getMe').mockResolvedValueOnce(null);

      return request(app.getHttpServer())
        .get('/users/me')
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('User not found');
        });
    });
  });

  describe('PUT /users/me', () => {
    it('should update the current user profile', () => {
      const updateData = { name: 'John Updated' };

      return request(app.getHttpServer())
        .put('/users/me')
        .send(updateData)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.name).toBe(updateData.name);
          expect(res.body.email).toBe(mockUsers[0].email);
          expect(service.updateMe).toHaveBeenCalledWith(updateData);
        });
    });

    it('should return 400 when name is empty', () => {
      const userId = mockUsers[0]._id;
      const emptyUpdate = {};

      return request(app.getHttpServer())
        .put('/users/me')
        .send(emptyUpdate)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('name must be a string');
        });
    });

    it('should return 404 when user not found during update', async () => {
      jest.spyOn(service, 'updateMe').mockResolvedValueOnce(null);

      return request(app.getHttpServer())
        .put('/users/me')
        .send({ name: 'New Name' })
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('User not found');
        });
    });

    it('should return 400 if invalid data is provided', () => {
      return request(app.getHttpServer())
        .put('/users/me')
        .send({ name: 123 })
        .expect(400);
    });
  });
});
