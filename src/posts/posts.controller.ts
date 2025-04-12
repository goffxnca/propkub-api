import { Controller, Get, Param, Post } from '@nestjs/common';
import { PostsService } from './posts.service';
import { Post as PostType } from './posts.schema';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  findAll(): Promise<PostType[]> {
    return this.postsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<PostType | null> {
    return this.postsService.findOne(id);
  }

  @Get('province/:provinceId')
  findByProvinceId(@Param('provinceId') provinceId: string): Promise<PostType[]> {
    return this.postsService.findByProvinceId(provinceId);
  }

  @Get('district/:districtId')
  findByDistrictId(@Param('districtId') districtId: string): Promise<PostType[]> {
    return this.postsService.findByDistrictId(districtId);
  }

  @Get('subdistrict/:subDistrictId')
  findBySubDistrictId(@Param('subDistrictId') subDistrictId: string): Promise<PostType[]> {
    return this.postsService.findBySubDistrictId(subDistrictId);
  }

  @Get('asset-type/:assetType')
  findByAssetType(@Param('assetType') assetType: string): Promise<PostType[]> {
    return this.postsService.findByAssetType(assetType);
  }

  @Get('post-type/:postType')
  findByPostType(@Param('postType') postType: string): Promise<PostType[]> {
    return this.postsService.findByPostType(postType);
  }

  @Post(':id/view')
  incrementViews(@Param('id') id: string): Promise<PostType | null> {
    return this.postsService.incrementViews(id);
  }
} 