import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { PostsService } from '../../src/posts/posts.service';
import {
  AreaUnit,
  Condition,
  Post,
  PostType,
  AssetType,
  PostStatus,
} from '../../src/posts/posts.schema';
import { createPost } from '../factory/postFactory';
import {
  rootMongooseTestModule,
  closeMongodConnection,
} from '../utils/mongodb-memory';
import { PostsModule } from '../../src/posts/posts.module';
import { ConfigModule } from '@nestjs/config';
import { Model, Types } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import { CreatePostDto } from '../../src/posts/dto/createPostDto';
import { AuthModule } from '../../src/auth/auth.module';
import { UsersService } from '../../src/users/users.service';
import { authHeader, createUserAndLogIn } from '../utils/auths';
import { User } from '../../src/users/users.schema';
import { createUser } from '../factory/userFactory';
import { MailService } from '../../src/mail/mail.service';
import {
  PostActions,
  PostActionType,
} from '../../src/postActions/postActions.schema';
import { POST_ACTIONS_FLOW } from '../../src/common/postActionsFlow';

describe('Posts (e2e)', () => {
  let app: INestApplication;
  let service: PostsService;
  let usersService: UsersService;
  let mailService: MailService;
  let postModel: Model<Post>;
  let userModel: Model<User>;
  let postActionsModel: Model<PostActions>;
  let testUser: User;
  let authToken: string;

  const mockPosts: Post[] = [
    createPost({
      _id: new Types.ObjectId().toString(),
      title: 'Luxury Condo in Bangkok',
      address: {
        provinceId: '1',
        provinceLabel: 'Bangkok',
        districtId: '1',
        districtLabel: 'Phra Nakhon',
        subDistrictId: '1',
        subDistrictLabel: 'Phra Borom Maha Ratchawang',
        regionId: '1',
        location: { lat: 13.7563, lng: 100.5018 },
      },
    }),
    createPost({
      _id: new Types.ObjectId().toString(),
      title: 'Modern House for Rent',
      assetType: AssetType.HOUSE,
      postType: PostType.RENT,
      address: {
        provinceId: '1',
        provinceLabel: 'Bangkok',
        districtId: '1',
        districtLabel: 'Phra Nakhon',
        subDistrictId: '1',
        subDistrictLabel: 'Phra Borom Maha Ratchawang',
        regionId: '1',
        location: { lat: 13.7563, lng: 100.5018 },
      },
    }),
    createPost({
      _id: new Types.ObjectId().toString(),
      title: 'Luxury Villa in Bangkok',
      assetType: AssetType.HOUSE,
      address: {
        provinceId: '1',
        provinceLabel: 'Bangkok',
        districtId: '1',
        districtLabel: 'Phra Nakhon',
        subDistrictId: '1',
        subDistrictLabel: 'Phra Borom Maha Ratchawang',
        regionId: '1',
        location: { lat: 13.7563, lng: 100.5018 },
      },
    }),
    createPost({
      _id: new Types.ObjectId().toString(),
      title: 'Studio Apartment for Rent',
      assetType: AssetType.CONDO,
      postType: PostType.RENT,
      address: {
        provinceId: '1',
        provinceLabel: 'Bangkok',
        districtId: '2',
        districtLabel: 'Dusit',
        subDistrictId: '2',
        subDistrictLabel: 'Dusit',
        regionId: '1',
        location: { lat: 13.7763, lng: 100.5168 },
      },
    }),
    createPost({
      _id: new Types.ObjectId().toString(),
      title: 'Townhome in CBD',
      assetType: AssetType.TOWNHOME,
      address: {
        provinceId: '1',
        provinceLabel: 'Bangkok',
        districtId: '2',
        districtLabel: 'Dusit',
        subDistrictId: '2',
        subDistrictLabel: 'Dusit',
        regionId: '1',
        location: { lat: 13.7763, lng: 100.5168 },
      },
    }),
    createPost({
      _id: new Types.ObjectId().toString(),
      title: 'Townhome for Sale',
      assetType: AssetType.TOWNHOME,
      address: {
        provinceId: '2',
        provinceLabel: 'Nonthaburi',
        districtId: '3',
        districtLabel: 'Mueang Nonthaburi',
        subDistrictId: '3',
        subDistrictLabel: 'Suan Yai',
        regionId: '1',
        location: { lat: 13.8625, lng: 100.5144 },
      },
    }),
    createPost({
      _id: new Types.ObjectId().toString(),
      title: 'Land Plot in Suburb',
      assetType: AssetType.LAND,
      address: {
        provinceId: '2',
        provinceLabel: 'Nonthaburi',
        districtId: '3',
        districtLabel: 'Mueang Nonthaburi',
        subDistrictId: '3',
        subDistrictLabel: 'Suan Yai',
        regionId: '1',
        location: { lat: 13.8625, lng: 100.5144 },
      },
    }),
    createPost({
      _id: new Types.ObjectId().toString(),
      title: 'Penthouse with City View',
      assetType: AssetType.CONDO,
      address: {
        provinceId: '2',
        provinceLabel: 'Nonthaburi',
        districtId: '4',
        districtLabel: 'Bang Kruai',
        subDistrictId: '4',
        subDistrictLabel: 'Bang Kruai',
        regionId: '1',
        location: { lat: 13.805, lng: 100.4722 },
      },
    }),
    createPost({
      _id: new Types.ObjectId().toString(),
      title: 'Family House with Garden',
      assetType: AssetType.HOUSE,
      address: {
        provinceId: '2',
        provinceLabel: 'Nonthaburi',
        districtId: '4',
        districtLabel: 'Bang Kruai',
        subDistrictId: '4',
        subDistrictLabel: 'Bang Kruai',
        regionId: '1',
        location: { lat: 13.805, lng: 100.4722 },
      },
    }),
    createPost({
      _id: new Types.ObjectId().toString(),
      title: 'Luxury Condo for Rent',
      assetType: AssetType.CONDO,
      postType: PostType.RENT,
      address: {
        provinceId: '2',
        provinceLabel: 'Nonthaburi',
        districtId: '4',
        districtLabel: 'Bang Kruai',
        subDistrictId: '4',
        subDistrictLabel: 'Bang Kruai',
        regionId: '1',
        location: { lat: 13.805, lng: 100.4722 },
      },
    }),
  ];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env.test' }),
        rootMongooseTestModule(),
        PostsModule,
        AuthModule,
      ],
    })
      .overrideProvider(MailService)
      .useValue({
        sendEmail: jest.fn().mockResolvedValue(undefined),
      })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    service = moduleFixture.get<PostsService>(PostsService);
    usersService = moduleFixture.get<UsersService>(UsersService);
    mailService = moduleFixture.get<MailService>(MailService);

    postModel = moduleFixture.get<Model<Post>>(getModelToken(Post.name));
    userModel = moduleFixture.get<Model<User>>(getModelToken(User.name));
    postActionsModel = moduleFixture.get<Model<PostActions>>(
      getModelToken(PostActions.name),
    );

    await app.init();

    const [user, token] = await createUserAndLogIn(
      createUser(),
      app,
      usersService,
    );

    authToken = token;
    testUser = user;

    for (const post of mockPosts) {
      await service.seedTest(post);
    }
  });

  afterAll(async () => {
    await postActionsModel.deleteMany();
    await postModel.deleteMany();
    await userModel.deleteMany();
    await app.close();
    await closeMongodConnection();
  });

  describe('GET /posts', () => {
    describe('Pagination Functionalities', () => {
      it('should return first 4 items when limit=4, offset=0', () => {
        return request(app.getHttpServer())
          .get('/posts?limit=4&offset=0')
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(4);
            expect(res.body[0].title).toBe(mockPosts[0].title);
            expect(res.body[3].title).toBe(mockPosts[3].title);
          });
      });

      it('should return second page (items 5-8) when limit=4, offset=4', () => {
        return request(app.getHttpServer())
          .get('/posts?limit=4&offset=4')
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(4);
            expect(res.body[0].title).toBe(mockPosts[4].title);
            expect(res.body[3].title).toBe(mockPosts[7].title);
          });
      });

      it('should return partial page (items 9-10) when limit=4, offset=8', () => {
        return request(app.getHttpServer())
          .get('/posts?limit=4&offset=8')
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(2);
            expect(res.body[0].title).toBe(mockPosts[8].title);
            expect(res.body[1].title).toBe(mockPosts[9].title);
          });
      });

      it('should return empty array when offset is beyond available items (limit=4, offset=999)', () => {
        return request(app.getHttpServer())
          .get('/posts?limit=4&offset=999')
          .expect(200)
          .expect((res) => {
            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body).toHaveLength(0);
          });
      });
    });

    describe('Pagination Validations', () => {
      it('should return 400 when both limit and offset are missing', () => {
        return request(app.getHttpServer())
          .get('/posts')
          .expect(400)
          .expect((res) => {
            expect(res.body.message).toContain('limit should not be empty');
            expect(res.body.message).toContain('offset should not be empty');
          });
      });

      it('should return 400 when limit is missing', () => {
        return request(app.getHttpServer())
          .get('/posts?offset=0')
          .expect(400)
          .expect((res) => {
            expect(res.body.message).toContain('limit should not be empty');
          });
      });

      it('should return 400 when offset is missing', () => {
        return request(app.getHttpServer())
          .get('/posts?limit=10')
          .expect(400)
          .expect((res) => {
            expect(res.body.message).toContain('offset should not be empty');
          });
      });

      it('should return 400 when limit is not a number', () => {
        return request(app.getHttpServer())
          .get('/posts?limit=abc&offset=0')
          .expect(400)
          .expect((res) => {
            expect(res.body.message).toContain(
              'limit must be an integer number',
            );
          });
      });

      it('should return 400 when offset is not a number', () => {
        return request(app.getHttpServer())
          .get('/posts?limit=10&offset=abc')
          .expect(400)
          .expect((res) => {
            expect(res.body.message).toContain(
              'offset must be an integer number',
            );
          });
      });

      it('should return 400 when limit is less than 1', () => {
        return request(app.getHttpServer())
          .get('/posts?limit=0&offset=0')
          .expect(400)
          .expect((res) => {
            expect(res.body.message).toContain('limit must not be less than 1');
          });
      });

      it('should return 400 when limit is greater than 50', () => {
        return request(app.getHttpServer())
          .get('/posts?limit=51&offset=0')
          .expect(400)
          .expect((res) => {
            expect(res.body.message).toContain(
              'limit must not be greater than 50',
            );
          });
      });

      it('should return 400 when offset is negative', () => {
        return request(app.getHttpServer())
          .get('/posts?limit=10&offset=-1')
          .expect(400)
          .expect((res) => {
            expect(res.body.message).toContain(
              'offset must not be less than 0',
            );
          });
      });
    });

    describe('GET /posts/:id', () => {
      it('should return a post when found', () => {
        const firstPost = mockPosts[0];
        return request(app.getHttpServer())
          .get(`/posts/${firstPost._id}`)
          .expect(200)
          .expect((res) => {
            expect(res.body._id).toBe(firstPost._id);
            expect(res.body.title).toBe('Luxury Condo in Bangkok');
          });
      });
      it('should return 404 when post is not found', () => {
        const notExistingId = new Types.ObjectId().toString();
        return request(app.getHttpServer())
          .get(`/posts/${notExistingId}`)
          .expect(404)
          .expect({
            statusCode: 404,
            message: `Post with ID ${notExistingId} not found`,
            error: 'Not Found',
          });
      });
    });

    describe('GET /posts/province/:provinceId', () => {
      it('should return posts for a province', () => {
        const provinceId = '1';
        return request(app.getHttpServer())
          .get(`/posts/province/${provinceId}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.length).toBe(5);
            expect(
              res.body.every((p) => p.address.provinceId === provinceId),
            ).toBe(true);
          });
      });

      it('should return empty array for non-existent province', () => {
        return request(app.getHttpServer())
          .get('/posts/province/999')
          .expect(200)
          .expect([]);
      });
    });

    describe('GET /posts/district/:districtId', () => {
      it('should return posts for a district', () => {
        const districtId = '1';
        return request(app.getHttpServer())
          .get(`/posts/district/${districtId}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.length).toBe(3);
            expect(
              res.body.every((p) => p.address.districtId === districtId),
            ).toBe(true);
          });
      });

      it('should return empty array for non-existent district', () => {
        return request(app.getHttpServer())
          .get('/posts/district/999')
          .expect(200)
          .expect([]);
      });
    });

    describe('GET /posts/subdistrict/:subDistrictId', () => {
      it('should return posts for a subdistrict', () => {
        const subDistrictId = '1';
        return request(app.getHttpServer())
          .get(`/posts/subdistrict/${subDistrictId}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.length).toBe(3);
            expect(
              res.body.every((p) => p.address.subDistrictId === subDistrictId),
            ).toBe(true);
          });
      });

      it('should return empty array for non-existent subdistrict', () => {
        return request(app.getHttpServer())
          .get('/posts/subdistrict/999')
          .expect(200)
          .expect([]);
      });
    });

    describe('GET /posts/asset-type/:assetType', () => {
      it('should return posts for an asset type', () => {
        const assetType = AssetType.HOUSE;
        return request(app.getHttpServer())
          .get(`/posts/asset-type/${assetType}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.length).toBe(3);
            expect(res.body.every((p) => p.assetType === assetType)).toBe(true);
          });
      });
    });

    describe('GET /posts/post-type/:postType', () => {
      it('should return posts for a post type', () => {
        const postType = PostType.RENT;
        return request(app.getHttpServer())
          .get(`/posts/post-type/${postType}`)
          .expect(200)
          .expect((res) => {
            expect(res.body.length).toBe(3);
            expect(res.body.every((p) => p.postType === postType)).toBe(true);
          });
      });
    });

    describe('POST /posts/:id/view', () => {
      it('should increment views for a post', () => {
        const firstPost = mockPosts[0];
        const initialViews = firstPost.views.post;
        return request(app.getHttpServer())
          .post(`/posts/${firstPost._id}/view`)
          .expect(201)
          .expect((res) => {
            expect(res.body.views.post).toBe(initialViews + 1);
          });
      });
      it('should return 404 when post is not found', () => {
        const notExistingId = new Types.ObjectId().toString();
        return request(app.getHttpServer())
          .post(`/posts/${notExistingId}/view`)
          .expect(404)
          .expect({
            statusCode: 404,
            message: `Post with ID ${notExistingId} not found`,
            error: 'Not Found',
          });
      });
    });
  });

  describe('POST /posts', () => {
    const validCreatePostDto: CreatePostDto = {
      title: 'New post title',
      desc: '<a>This is a link</a><p>This is a paragraph</p>',
      assetType: AssetType.CONDO,
      postType: PostType.SALE,
      price: 1000.0,
      area: 10.0,
      areaUnit: AreaUnit.SQM,
      isDraft: true,
      isStudio: false,
      thumbnail: 'https://example.com/thumb.jpg',
      images: [
        'https://example.com/image1.jpg',
        'https://example.com/image2.jpg',
        'https://example.com/image3.jpg',
      ],
      facilities: [
        { id: 'pool', label: 'Swimming Pool' },
        { id: 'gym', label: 'Gym' },
      ],
      specs: [
        { id: 'bedrooms', label: 'Bedrooms', value: 10.121 },
        { id: 'bathrooms', label: 'Bathrooms', value: 100.111 },
      ],
      address: {
        provinceId: '1',
        provinceLabel: 'Bangkok',
        districtId: '1',
        districtLabel: 'Watthana',
        subDistrictId: '1',
        subDistrictLabel: 'Khlong Toei Nuea',
        regionId: '1',
        location: {
          lat: 10.001,
          lng: 100.101,
        },
      },
      condition: Condition.NEW,
    };

    it('should create a new post successfully when authenticated', async () => {
      const response = await request(app.getHttpServer())
        .post('/posts')
        .set(authHeader(authToken))
        .send(validCreatePostDto)
        .expect(201);

      expect(response.body.title).toBe(validCreatePostDto.title);
      expect(response.body.desc).toBe(
        'This is a link<p>This is a paragraph</p>',
      );
      expect(response.body.status).toBe('draft');
      expect(response.body.createdBy).toBe(testUser._id.toString());

      const createdPostId = response.body._id;
      const postAction = await postActionsModel
        .findOne({
          postId: createdPostId,
        })
        .sort({ createdAt: -1 });
      expect(postAction).toBeDefined();

      const expectedAction = POST_ACTIONS_FLOW.find(
        (paf) => paf.action === PostActionType.DRAFT,
      );
      expect(expectedAction).toBeDefined();

      expect(postAction!.type).toBe(PostActionType.DRAFT);
      expect(postAction!.label).toBe(expectedAction!.actionLabel);
      expect(postAction!.from).toBe(PostStatus.__EMPTY);
      expect(postAction!.to).toBe(PostStatus.DRAFT);
      expect(postAction!.postId.toString()).toBe(createdPostId);
      expect(postAction!.createdBy.toString()).toBe(testUser._id.toString());
      expect(postAction!.note).toBe('');
    });

    it('should return 401 when not authenticated', () => {
      return request(app.getHttpServer())
        .post('/posts')
        .send(validCreatePostDto)
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Unauthorized');
        });
    });

    it('should return 400 when required fields are missing', () => {
      const invalidPost = {
        ...validCreatePostDto,
        title: undefined,
        price: undefined,
      };

      return request(app.getHttpServer())
        .post('/posts')
        .set(authHeader(authToken))
        .send(invalidPost)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('title should not be empty');
          expect(res.body.message).toContain('price should not be empty');
        });
    });

    // Security Test: Prevent injecting non-whitelisted field
    it('should return 400 when dangerous premium field is sent', () => {
      const hackerPost = {
        ...validCreatePostDto,
        premium: true, // Non-whitelisted
      };

      return request(app.getHttpServer())
        .post('/posts')
        .set(authHeader(authToken))
        .send(hackerPost)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain(
            'property premium should not exist',
          );
        });
    });
  });

  describe('PATCH /posts/:id', () => {
    let existingPost: Post;

    beforeEach(async () => {
      const post = await postModel.findOne();
      if (!post) {
        throw new Error('No test post found');
      }
      existingPost = post;
    });

    const validUpdatePostDto = {
      title: 'Updated post title',
      desc: '<a>This is a link22</a><p>This is a paragraph22</p>',
      assetType: AssetType.HOUSE,
      postType: PostType.RENT,
      price: 99999.99,
      area: 99.99,
      areaUnit: AreaUnit.RAI,
      isDraft: false,
      isStudio: true,
      thumbnail: 'https://example.com/thumb_updated.jpg',
      images: [
        'https://example.com/image1_updated.jpg',
        'https://example.com/image2_updated.jpg',
        'https://example.com/image3_updated.jpg',
      ],
      facilities: [
        { id: 'pool', label: 'Swimming Pool_updated' },
        { id: 'gym', label: 'Gym_updated' },
      ],
      specs: [
        { id: 'bedrooms', label: 'Bedrooms', value: 99 },
        { id: 'bathrooms', label: 'Bathrooms', value: 99.99 },
      ],
      address: {
        provinceId: '1',
        provinceLabel: 'Bangkok_updated',
        districtId: '1',
        districtLabel: 'Watthana_updated',
        subDistrictId: '1',
        subDistrictLabel: 'Khlong Toei Nuea_updated',
        regionId: '1',
        location: {
          lat: 99.989,
          lng: 999.949,
        },
      },
      condition: Condition.USED,
    };

    it('should update post successfully when pass all post fields and authenticated', async () => {
      const sendEmailSpy = jest.spyOn(mailService, 'sendEmail');

      const beforeUpdate = new Date();

      const response = await request(app.getHttpServer())
        .patch(`/posts/${existingPost._id}`)
        .set(authHeader(authToken))
        .send(validUpdatePostDto)
        .expect(200);

      expect(response.body.title).toBe(validUpdatePostDto.title);
      expect(response.body.desc).toBe(
        'This is a link22<p>This is a paragraph22</p>',
      );
      expect(response.body.assetType).toBe(validUpdatePostDto.assetType);
      expect(response.body.postType).toBe(validUpdatePostDto.postType);
      expect(response.body.price).toBe(validUpdatePostDto.price);
      expect(response.body.area).toBe(validUpdatePostDto.area);
      expect(response.body.areaUnit).toBe(validUpdatePostDto.areaUnit);
      expect(response.body.status).toBe('active');
      expect(response.body.isStudio).toBe(validUpdatePostDto.isStudio);
      expect(response.body.thumbnail).toBe(validUpdatePostDto.thumbnail);
      expect(JSON.stringify(response.body.images)).toBe(
        JSON.stringify(validUpdatePostDto.images),
      );
      expect(JSON.stringify(response.body.facilities)).toBe(
        JSON.stringify(validUpdatePostDto.facilities),
      );
      expect(JSON.stringify(response.body.specs)).toBe(
        JSON.stringify(validUpdatePostDto.specs),
      );
      expect(validUpdatePostDto.address.provinceLabel).toBe(
        validUpdatePostDto.address.provinceLabel,
      );
      expect(response.body.condition).toBe(validUpdatePostDto.condition);

      expect(response.body.updatedBy).toBe(testUser._id.toString());
      expect(new Date(response.body.updatedAt)).toBeInstanceOf(Date);
      expect(new Date(response.body.updatedAt).getTime()).toBeGreaterThan(
        beforeUpdate.getTime(),
      );

      const updatedPost = await postModel.findById(existingPost._id);
      expect(updatedPost).toBeDefined();
      expect(updatedPost?.title).toBe(validUpdatePostDto.title);

      const updatedPostId = response.body._id;
      const postAction = await postActionsModel
        .findOne({
          postId: updatedPostId,
        })
        .sort({ createdAt: -1 });
      expect(postAction).toBeDefined();

      const expectedAction = POST_ACTIONS_FLOW.find(
        (paf) => paf.action === PostActionType.UDPATE,
      );
      expect(expectedAction).toBeDefined();

      expect(postAction!.type).toBe(PostActionType.UDPATE);
      expect(postAction!.label).toBe(expectedAction!.actionLabel);
      expect(postAction!.from).toBe(PostStatus.ACTIVE);
      expect(postAction!.to).toBe(PostStatus.ACTIVE);
      expect(postAction!.postId.toString()).toBe(updatedPostId);
      expect(postAction!.createdBy.toString()).toBe(testUser._id.toString());
      expect(postAction!.note).toBe('');

      expect(sendEmailSpy).toHaveBeenCalled();
    });

    it('should update post successfully when pass only title and authenticated', async () => {
      const response = await request(app.getHttpServer())
        .patch(`/posts/${existingPost._id}`)
        .set(authHeader(authToken))
        .send({ title: 'Title updated22' })
        .expect(200);

      expect(response.body.title).toBe('Title updated22');
    });

    it('should return 401 when not authenticated', () => {
      return request(app.getHttpServer())
        .patch(`/posts/${existingPost._id}`)
        .send(validUpdatePostDto)
        .expect(401)
        .expect((res) => {
          expect(res.body.message).toBe('Unauthorized');
        });
    });

    it('should return 404 when post does not exist', () => {
      const nonExistentId = new Types.ObjectId().toString();
      return request(app.getHttpServer())
        .patch(`/posts/${nonExistentId}`)
        .set(authHeader(authToken))
        .send(validUpdatePostDto)
        .expect(404)
        .expect((res) => {
          expect(res.body.message).toBe(
            `Post with ID ${nonExistentId} not found`,
          );
        });
    });

    it('should return 400 when required fields are missing', () => {
      const invalidUpdate = {
        title: '',
      };

      return request(app.getHttpServer())
        .patch(`/posts/${existingPost._id}`)
        .set(authHeader(authToken))
        .send(invalidUpdate)
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('title should not be empty');
        });
    });

    it('should return 400 when non-nullable fields are null or empty', () => {
      return request(app.getHttpServer())
        .patch(`/posts/${existingPost._id}`)
        .set(authHeader(authToken))
        .send({ title: null, desc: '' })
        .expect(400)
        .expect((res) => {
          expect(res.body.message).toContain('title must be a string');
          expect(res.body.message).toContain('desc should not be empty');
        });
    });
  });
});
