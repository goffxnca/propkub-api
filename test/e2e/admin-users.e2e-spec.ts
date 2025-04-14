import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AdminUsersController } from '../../src/admin/users/admin-users.controller';
import { AdminUsersService } from '../../src/admin/users/admin-users.service';
import { User, UserRole } from '../../src/users/users.schema';
import { CreateUserDto, UpdateUserDto } from '../../src/users/dto/user.dto';
import { createUser } from '../factory/userFactory';
import { PaginationDto } from '../../src/common/dto/pagination.dto';

describe('AdminUsers (e2e)', () => {
  let app: INestApplication;
  let service: AdminUsersService;

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
      controllers: [AdminUsersController],
      providers: [
        {
          provide: AdminUsersService,
          useValue: {
            findAll: jest
              .fn()
              .mockImplementation((limit: number, offset: number) => {
                const paginatedUsers = mockUsers.slice(offset, offset + limit);
                return Promise.resolve(paginatedUsers);
              }),
            findOne: jest.fn().mockImplementation((id: string) => {
              const user = mockUsers.find((u) => u._id === id);
              return Promise.resolve(user || null);
            }),
            create: jest
              .fn()
              .mockImplementation((createUserDto: CreateUserDto) => {
                const newUser = createUser({
                  ...createUserDto,
                  _id: String(mockUsers.length + 1),
                  createdBy: 'admin',
                }) as User;
                return Promise.resolve(newUser);
              }),
            update: jest
              .fn()
              .mockImplementation(
                (id: string, updateUserDto: UpdateUserDto) => {
                  const userIndex = mockUsers.findIndex((u) => u._id === id);
                  if (userIndex === -1) return Promise.resolve(null);

                  const updatedUser = {
                    ...mockUsers[userIndex],
                    ...updateUserDto,
                  };
                  return Promise.resolve(updatedUser);
                },
              ),
            remove: jest.fn().mockImplementation((id: string) => {
              const userIndex = mockUsers.findIndex((u) => u._id === id);
              if (userIndex === -1) return Promise.resolve(null);

              return Promise.resolve(mockUsers[userIndex]);
            }),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    service = moduleFixture.get<AdminUsersService>(AdminUsersService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /admin/users', () => {
    it('should return users with pagination', () => {
      return request(app.getHttpServer())
        .get('/admin/users?limit=2&offset=0')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(2);
          expect(res.body[0]._id).toBe(mockUsers[0]._id);
          expect(res.body[1]._id).toBe(mockUsers[1]._id);
        });
    });

    it('should return paginated users when limit and offset provided', () => {
      return request(app.getHttpServer())
        .get('/admin/users?limit=2&offset=2')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body).toHaveLength(1);
          expect(res.body[0]._id).toBe(mockUsers[2]._id);
        });
    });
  });

  describe('GET /admin/users/:id', () => {
    it('should return a user by id', () => {
      const userId = mockUsers[0]._id;

      return request(app.getHttpServer())
        .get(`/admin/users/${userId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body._id).toBe(mockUsers[0]._id);
          expect(res.body.name).toBe(mockUsers[0].name);
          expect(res.body.email).toBe(mockUsers[0].email);
        });
    });

    it('should return 404 when user not found', () => {
      return request(app.getHttpServer())
        .get('/admin/users/nonexistent-id')
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('not found');
        });
    });
  });

  describe('POST /admin/users', () => {
    it('should create a new user', () => {
      const createUserDto: CreateUserDto = {
        name: 'New User',
        email: 'new.user@example.com',
      };

      return request(app.getHttpServer())
        .post('/admin/users')
        .send(createUserDto)
        .expect(201)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.name).toBe(createUserDto.name);
          expect(res.body.email).toBe(createUserDto.email);
          expect(res.body.createdBy).toBe('admin');
          expect(service.create).toHaveBeenCalledWith(
            expect.objectContaining(createUserDto),
          );
        });
    });

    it('should return 400 if required fields are missing', () => {
      return request(app.getHttpServer())
        .post('/admin/users')
        .send({ name: 'Invalid User' }) // missing email
        .expect(400);
    });

    it('should return 400 if email is invalid', () => {
      return request(app.getHttpServer())
        .post('/admin/users')
        .send({ name: 'Invalid User', email: 'not-an-email' })
        .expect(400);
    });
  });

  describe('PUT /admin/users/:id', () => {
    it('should update a user', () => {
      const userId = mockUsers[0]._id;
      const updateUserDto: UpdateUserDto = {
        name: 'Updated Name',
      };

      return request(app.getHttpServer())
        .put(`/admin/users/${userId}`)
        .send(updateUserDto)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(res.body.name).toBe(updateUserDto.name);
          expect(service.update).toHaveBeenCalledWith(userId, updateUserDto);
        });
    });

    it('should return 404 when updating non-existent user', () => {
      return request(app.getHttpServer())
        .put('/admin/users/nonexistent-id')
        .send({ name: 'Updated Name' })
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('not found');
        });
    });
  });

  describe('DELETE /admin/users/:id', () => {
    it('should delete a user', () => {
      const userId = mockUsers[0]._id;

      return request(app.getHttpServer())
        .delete(`/admin/users/${userId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toBeDefined();
          expect(service.remove).toHaveBeenCalledWith(userId);
        });
    });

    it('should return 404 when deleting non-existent user', () => {
      return request(app.getHttpServer())
        .delete('/admin/users/nonexistent-id')
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toContain('not found');
        });
    });
  });
});
