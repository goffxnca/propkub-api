import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { PostsController } from '../../src/posts/posts.controller';
import { PostsService } from '../../src/posts/posts.service';
import { Post } from '../../src/posts/posts.schema';
import { PostType, AssetType } from '../../src/posts/posts.schema';
import { createPost } from '../factory/postFactory';

describe('Posts (e2e)', () => {
  let app: INestApplication;
  let service: PostsService;

  const mockPosts: Post[] = [
    createPost({
      ___id: '1',
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
      ___id: '2',
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
      ___id: '3',
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
      ___id: '4',
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
      ___id: '5',
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
      ___id: '6',
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
      ___id: '7',
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
      ___id: '8',
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
      ___id: '9',
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
      ___id: '10',
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

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: PostsService,
          useValue: {
            findAll: jest
              .fn()
              .mockImplementation((limit: number, offset: number) => {
                const paginatedPosts = mockPosts.slice(offset, offset + limit);
                return Promise.resolve(paginatedPosts);
              }),
            findOne: jest.fn().mockImplementation((id) => {
              const post = mockPosts.find((p) => p.___id === id);
              return Promise.resolve(post || null);
            }),
            findByProvinceId: jest.fn().mockImplementation((provinceId) => {
              const filteredPosts = mockPosts.filter(
                (p) => p.address.provinceId === provinceId,
              );
              return Promise.resolve(filteredPosts);
            }),
            findByDistrictId: jest.fn().mockImplementation((districtId) => {
              const filteredPosts = mockPosts.filter(
                (p) => p.address.districtId === districtId,
              );
              return Promise.resolve(filteredPosts);
            }),
            findBySubDistrictId: jest
              .fn()
              .mockImplementation((subDistrictId) => {
                const filteredPosts = mockPosts.filter(
                  (p) => p.address.subDistrictId === subDistrictId,
                );
                return Promise.resolve(filteredPosts);
              }),
            findByAssetType: jest.fn().mockImplementation((assetType) => {
              const filteredPosts = mockPosts.filter(
                (p) => p.assetType === assetType,
              );
              return Promise.resolve(filteredPosts);
            }),
            findByPostType: jest.fn().mockImplementation((postType) => {
              const filteredPosts = mockPosts.filter(
                (p) => p.postType === postType,
              );
              return Promise.resolve(filteredPosts);
            }),
            incrementViews: jest.fn().mockImplementation((id) => {
              const post = mockPosts.find((p) => p.___id === id);
              if (post) {
                post.postViews += 1;
                return Promise.resolve(post);
              }
              return Promise.resolve(null);
            }),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true }));
    service = moduleFixture.get<PostsService>(PostsService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
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
  });

  describe('GET /posts/:id', () => {
    it('should return a post when found', () => {
      return request(app.getHttpServer())
        .get('/posts/1')
        .expect(200)
        .expect((res) => {
          expect(res.body.___id).toBe('1');
          expect(res.body.title).toBe('Luxury Condo in Bangkok');
        });
    });

    it('should return 404 when post is not found', () => {
      return request(app.getHttpServer()).get('/posts/999').expect(404).expect({
        statusCode: 404,
        message: 'Post with ID 999 not found',
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
      const initialViews = mockPosts[0].postViews;
      return request(app.getHttpServer())
        .post('/posts/1/view')
        .expect(201)
        .expect((res) => {
          expect(res.body.postViews).toBe(initialViews + 1);
        });
    });

    it('should return 404 when post is not found', () => {
      return request(app.getHttpServer())
        .post('/posts/999/view')
        .expect(404)
        .expect({
          statusCode: 404,
          message: 'Post with ID 999 not found',
          error: 'Not Found',
        });
    });
  });
});
