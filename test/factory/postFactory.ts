import {
  Post,
  PostStatus,
  PostType,
  AssetType,
  AreaUnit,
  TimeUnit,
  Condition,
} from '../../src/posts/posts.schema';
import { faker } from '@faker-js/faker';

const now = new Date();

// Base post template
export const basePost: Post = {
  _id: '1',
  title: 'Luxury Condo in Bangkok',
  slug: 'luxury-condo-bangkok_P001',
  desc: faker.lorem.paragraph(),
  assetType: AssetType.CONDO,
  postType: PostType.SALE,
  price: 5000000,
  area: 100,
  areaUnit: AreaUnit.SQM,
  status: PostStatus.ACTIVE,
  byMember: true,
  isStudio: false,
  thumbnail: faker.image.url(),
  images: [faker.image.url(), faker.image.url()],
  facilities: [
    { id: 'pool', label: 'Swimming Pool' },
    { id: 'gym', label: 'Gym' },
  ],
  specs: [
    { id: '1', label: 'Bedrooms', value: 2 },
    { id: '2', label: 'Bathrooms', value: 2 },
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
      lng: 100.5018,
    },
  },
  views: {
    post: 0,
    phone: 0,
    line: 0,
  },
  cid: 1,
  postNumber: 'P001',
  condition: Condition.NEW,
  createdAt: now,
  createdBy: '1',
};

export const createPost = (overrides: Partial<Post> = {}): Post => {
  const merged = {
    ...basePost,
    ...overrides,
  };

  // Deep merge for nested objects
  if (overrides.address) {
    merged.address = {
      ...basePost.address,
      ...overrides.address,
    };
  }

  return merged;
};
