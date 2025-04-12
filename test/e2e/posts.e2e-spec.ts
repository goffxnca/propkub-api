import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';

import { PostsController } from '../../src/posts/posts.controller';
import { Post } from '../../src/posts/posts.schema';
import { PostsService } from '../../src/posts/posts.service';
import { PostStatus, PostSubStatus, PostType, AssetType, AreaUnit, TimeUnit, Condition } from '../../src/posts/posts.schema';

describe('Posts (e2e)', () => {
  let app: INestApplication;
  let service: PostsService;

  const now = new Date();
  const mockPosts: Post[] = [
    {
      id: '1',
      title: 'Luxury Condo in Bangkok',
      slug: 'luxury-condo-bangkok',
      desc: 'Beautiful condo in prime location',
      assetType: AssetType.CONDO,
      postType: PostType.SALE,
      price: 5000000,
      priceUnit: AreaUnit.SQM,
      area: 100,
      areaUnit: AreaUnit.SQM,
      status: PostStatus.ACTIVE,
      subStatus: PostSubStatus.CREATED,
      isMember: true,
      isStudio: false,
      thumbnail: 'https://example.com/thumb1.jpg',
      images: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
      facilities: [
        { id: 'pool', label: 'Swimming Pool' },
        { id: 'gym', label: 'Gym' }
      ],
      specs: [
        { id: '1', label: 'Bedrooms', value: 2 },
        { id: '2', label: 'Bathrooms', value: 2 }
      ],
      address: {
        provinceId: '1',
        provinceLabel: 'Bangkok',
        districtId: '1',
        districtLabel: 'Phra Nakhon',
        subDistrictId: '1',
        subDistrictLabel: 'Phra Borom Maha Ratchawang',
        regionId: '1',
        location: {
          lat: 13.7563,
          lng: 100.5018
        }
      },
      createdAt: now,
      updatedAt: now,
      postViews: 0,
      phoneViews: 0,
      lineViews: 0,
      cid: 1,
      postNumber: 'P001',
      land: 0,
      landUnit: AreaUnit.SQM,
      condition: Condition.NEW,
      contact: {
        name: 'John Doe',
        phone: '0812345678',
        line: 'johndoe'
      },
      createdBy: {
        userId: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '0812345678',
        role: 'agent'
      },
      updatedBy: {
        userId: '1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '0812345678',
        role: 'agent'
      }
    },
    {
      id: '2',
      title: 'Modern House for Rent',
      slug: 'modern-house-rent',
      desc: 'Spacious house in quiet neighborhood',
      assetType: AssetType.HOUSE,
      postType: PostType.RENT,
      price: 30000,
      priceUnit: TimeUnit.MONTH,
      area: 200,
      areaUnit: AreaUnit.SQM,
      status: PostStatus.ACTIVE,
      subStatus: PostSubStatus.CREATED,
      isMember: false,
      isStudio: false,
      thumbnail: 'https://example.com/thumb2.jpg',
      images: ['https://example.com/img3.jpg', 'https://example.com/img4.jpg'],
      facilities: [
        { id: 'parking', label: 'Parking' },
        { id: 'garden', label: 'Garden' }
      ],
      specs: [
        { id: '1', label: 'Bedrooms', value: 3 },
        { id: '2', label: 'Bathrooms', value: 2 }
      ],
      address: {
        provinceId: '1',
        provinceLabel: 'Bangkok',
        districtId: '2',
        districtLabel: 'Dusit',
        subDistrictId: '2',
        subDistrictLabel: 'Dusit',
        regionId: '1',
        location: {
          lat: 13.7563,
          lng: 100.5018
        }
      },
      createdAt: now,
      updatedAt: now,
      postViews: 0,
      phoneViews: 0,
      lineViews: 0,
      cid: 2,
      postNumber: 'P002',
      land: 0,
      landUnit: AreaUnit.SQM,
      condition: Condition.USED,
      contact: {
        name: 'Jane Smith',
        phone: '0898765432',
        line: 'janesmith'
      },
      createdBy: {
        userId: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '0898765432',
        role: 'owner'
      },
      updatedBy: {
        userId: '2',
        name: 'Jane Smith',
        email: 'jane@example.com',
        phone: '0898765432',
        role: 'owner'
      }
    },
    {
      id: '3',
      title: 'Luxury Villa in Bangkok',
      slug: 'luxury-villa-bangkok',
      desc: 'Exclusive villa with private pool',
      assetType: AssetType.HOUSE,
      postType: PostType.SALE,
      price: 15000000,
      priceUnit: AreaUnit.SQM,
      area: 300,
      areaUnit: AreaUnit.SQM,
      status: PostStatus.ACTIVE,
      subStatus: PostSubStatus.CREATED,
      isMember: true,
      isStudio: false,
      thumbnail: 'https://example.com/thumb3.jpg',
      images: ['https://example.com/img5.jpg', 'https://example.com/img6.jpg'],
      facilities: [
        { id: 'pool', label: 'Swimming Pool' },
        { id: 'garden', label: 'Garden' }
      ],
      specs: [
        { id: '1', label: 'Bedrooms', value: 4 },
        { id: '2', label: 'Bathrooms', value: 3 }
      ],
      address: {
        provinceId: '1',
        provinceLabel: 'Bangkok',
        districtId: '1',
        districtLabel: 'Phra Nakhon',
        subDistrictId: '1',
        subDistrictLabel: 'Phra Borom Maha Ratchawang',
        regionId: '1',
        location: {
          lat: 13.7563,
          lng: 100.5018
        }
      },
      createdAt: now,
      updatedAt: now,
      postViews: 0,
      phoneViews: 0,
      lineViews: 0,
      cid: 3,
      postNumber: 'P003',
      land: 0,
      landUnit: AreaUnit.SQM,
      condition: Condition.NEW,
      contact: {
        name: 'Mike Johnson',
        phone: '0876543210',
        line: 'mikejohnson'
      },
      createdBy: {
        userId: '3',
        name: 'Mike Johnson',
        email: 'mike@example.com',
        phone: '0876543210',
        role: 'agent'
      },
      updatedBy: {
        userId: '3',
        name: 'Mike Johnson',
        email: 'mike@example.com',
        phone: '0876543210',
        role: 'agent'
      }
    }
  ];

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [
        {
          provide: PostsService,
          useValue: {
            findAll: jest.fn().mockResolvedValue(mockPosts),
            findOne: jest.fn().mockImplementation((id) => {
              const post = mockPosts.find(p => p.id === id);
              return Promise.resolve(post || null);
            }),
            findByProvinceId: jest.fn().mockImplementation((provinceId) => {
              return Promise.resolve(mockPosts.filter(p => p.address.provinceId === provinceId));
            }),
            findByDistrictId: jest.fn().mockImplementation((districtId) => {
              return Promise.resolve(mockPosts.filter(p => p.address.districtId === districtId));
            }),
            findBySubDistrictId: jest.fn().mockImplementation((subDistrictId) => {
              return Promise.resolve(mockPosts.filter(p => p.address.subDistrictId === subDistrictId));
            }),
            findByAssetType: jest.fn().mockImplementation((assetType) => {
              return Promise.resolve(mockPosts.filter(p => p.assetType === assetType));
            }),
            findByPostType: jest.fn().mockImplementation((postType) => {
              return Promise.resolve(mockPosts.filter(p => p.postType === postType));
            }),
            incrementViews: jest.fn().mockImplementation((id) => {
              const post = mockPosts.find(p => p.id === id);
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
    service = moduleFixture.get<PostsService>(PostsService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /posts', () => {
    it('should return an array of posts', () => {
      return request(app.getHttpServer())
        .get('/posts')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveLength(3);
          expect(res.body[0].id).toBe('1');
          expect(res.body[1].id).toBe('2');
          expect(res.body[2].id).toBe('3');
        });
    });
  });

  describe('GET /posts/:id', () => {
    it('should return a post when found', () => {
      return request(app.getHttpServer())
        .get('/posts/1')
        .expect(200)
        .expect((res) => {
          expect(res.body.id).toBe('1');
          expect(res.body.title).toBe('Luxury Condo in Bangkok');
        });
    });

    it('should return 404 when post is not found', () => {
      return request(app.getHttpServer())
        .get('/posts/999')
        .expect(404)
        .expect({
          statusCode: 404,
          message: 'Post with ID 999 not found',
          error: 'Not Found'
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
          expect(res.body.length).toBe(3);
          expect(res.body.every(p => p.address.provinceId === provinceId)).toBe(true);
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
          expect(res.body.length).toBe(2);
          expect(res.body.every(p => p.address.districtId === districtId)).toBe(true);
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
          expect(res.body.length).toBe(2);
          expect(res.body.every(p => p.address.subDistrictId === subDistrictId)).toBe(true);
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
          expect(res.body.length).toBe(2);
          expect(res.body.every(p => p.assetType === assetType)).toBe(true);
        });
    });
  });

  describe('GET /posts/post-type/:postType', () => {
    it('should return posts for a post type', () => {
      const postType = PostType.SALE;
      return request(app.getHttpServer())
        .get(`/posts/post-type/${postType}`)
        .expect(200)
        .expect((res) => {
          expect(res.body.length).toBe(2);
          expect(res.body.every(p => p.postType === postType)).toBe(true);
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
          error: 'Not Found'
        });
    });
  });
}); 