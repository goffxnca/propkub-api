import { Test, TestingModule } from '@nestjs/testing';
import { ProvincesController } from '../../src/provinces/provinces.controller';
import { ProvincesService } from '../../src/provinces/provinces.service';
import * as request from 'supertest';
import { INestApplication } from '@nestjs/common';
import { Province } from '../../src/provinces/provinces.schema';

describe('Provinces (e2e)', () => {
  let app: INestApplication;
  let service: ProvincesService;

  const mockProvinces: Province[] = [
    { id: '1', name: 'Bangkok', regionId: '1' },
    { id: '2', name: 'Chiang Mai', regionId: '2' },
  ];

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ProvincesController],
      providers: [
        {
          provide: ProvincesService,
          useValue: {
            findAll: jest.fn().mockResolvedValue(mockProvinces),
            findOne: jest.fn().mockImplementation((id) => {
              const province = mockProvinces.find(p => p.id === id);
              return Promise.resolve(province || null);
            }),
          },
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    service = moduleFixture.get<ProvincesService>(ProvincesService);
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /provinces', () => {
    it('should return an array of provinces', () => {
      return request(app.getHttpServer())
        .get('/provinces')
        .expect(200)
        .expect(mockProvinces);
    });
  });

  describe('GET /provinces/:id', () => {
    it('should return a province when found', () => {
      return request(app.getHttpServer())
        .get('/provinces/1')
        .expect(200)
        .expect(mockProvinces[0]);
    });

    it('should return 404 when province is not found', () => {
      return request(app.getHttpServer())
        .get('/provinces/999')
        .expect(404)
        .expect({
          statusCode: 404,
          message: 'Province with ID 999 not found',
          error: 'Not Found'
        });
    });
  });
}); 