import {
  Controller,
  Get,
  Post as PostRequest,
  Param,
  Post as HttpPost,
  NotFoundException,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { Post } from './posts.schema';
import { PaginationDto } from '../common/dto/pagination.dto';
import { MongoIdValidationPipe } from '../common/pipes/mongo-id.pipe';
import { CreatePostDto } from './dto/createPostDto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  async findAll(@Query() pagination: PaginationDto): Promise<Post[]> {
    return this.postsService.findAll(pagination.limit, pagination.offset);
  }

  @Get(':id')
  async findOne(@Param('id', MongoIdValidationPipe) id: string): Promise<Post> {
    const post = await this.postsService.findOne(id);
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return post;
  }

  @Get('province/:provinceId')
  findByProvinceId(@Param('provinceId') provinceId: string): Promise<Post[]> {
    return this.postsService.findByProvinceId(provinceId);
  }

  @Get('district/:districtId')
  findByDistrictId(@Param('districtId') districtId: string): Promise<Post[]> {
    return this.postsService.findByDistrictId(districtId);
  }

  @Get('subdistrict/:subDistrictId')
  findBySubDistrictId(
    @Param('subDistrictId') subDistrictId: string,
  ): Promise<Post[]> {
    return this.postsService.findBySubDistrictId(subDistrictId);
  }

  @Get('asset-type/:assetType')
  findByAssetType(@Param('assetType') assetType: string): Promise<Post[]> {
    return this.postsService.findByAssetType(assetType);
  }

  @Get('post-type/:postType')
  findByPostType(@Param('postType') postType: string): Promise<Post[]> {
    return this.postsService.findByPostType(postType);
  }

  @HttpPost(':id/view')
  async incrementViews(
    @Param('id', MongoIdValidationPipe) id: string,
  ): Promise<Post> {
    const post = await this.postsService.incrementViews(id);
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return post;
  }

  @UseGuards(JwtAuthGuard)
  @PostRequest()
  createPost(
    @Request() req,
    @Body() createPostDto: CreatePostDto,
  ): Promise<Post> {
    console.log('createPost...');
    return this.postsService.create(createPostDto, req.user.userId);
  }
}
