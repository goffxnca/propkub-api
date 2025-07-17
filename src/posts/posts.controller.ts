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
  Patch,
  HttpCode,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { Post } from './posts.schema';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto';
import { MongoIdValidationPipe } from '../common/pipes/mongo-id.pipe';
import { CreatePostDto } from './dto/createPostDto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ApiKeyGuard } from '../auth/guards/api-key.guard';
import { PostStatsResponseDto } from './dto/post-stats-response.dto';
import { UpdatePostDto } from './dto/updatePostDto';
import { PaginatedResponse } from '../common/utils/pagination';
import { IncreasePostStatsDto } from './dto/increase-post-stats.dto';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyPosts(
    @Request() req,
    @Query() pagination: PaginationQueryDto,
  ): Promise<PaginatedResponse<Post>> {
    const userId = req.user.userId;
    return this.postsService.findByUserId(
      userId,
      pagination.page,
      pagination.per_page,
    );
  }

  @Get('me/stats')
  @UseGuards(JwtAuthGuard)
  async getMyPostsStats(@Request() req): Promise<PostStatsResponseDto> {
    const userId = req.user.userId;
    return this.postsService.getUserPostsStats(userId);
  }

  @Get(':id/me')
  @UseGuards(JwtAuthGuard)
  async findOneForOwner(
    @Param('id', MongoIdValidationPipe) id: string,
    @Request() req,
  ): Promise<any> {
    const post = await this.postsService.findOneWithActionsForOwner(
      id,
      req.user.userId,
    );
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
    return this.postsService.create(createPostDto, req.user.userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  async updatePost(
    @Request() req,
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<Post> {
    const post = await this.postsService.update(
      id,
      updatePostDto,
      req.user.userId,
    );
    if (!post) {
      throw new NotFoundException(`Post with ID ${id} not found`);
    }
    return post;
  }

  @UseGuards(JwtAuthGuard)
  @HttpPost(':id/close')
  @HttpCode(200)
  async closePost(
    @Request() req,
    @Param('id', MongoIdValidationPipe) id: string,
  ): Promise<boolean> {
    await this.postsService.close(id, req.user.userId);
    return true;
  }

  @UseGuards(ApiKeyGuard)
  @Get()
  async findAll(
    @Query() pagination: PaginationQueryDto,
  ): Promise<PaginatedResponse<Post>> {
    return this.postsService.findAll(pagination.page, pagination.per_page);
  }

  @UseGuards(ApiKeyGuard)
  @Get('similar')
  async findSimilarPosts(
    @Query('postId', MongoIdValidationPipe) postId: string,
  ): Promise<Post[]> {
    return this.postsService.findSimilarPosts(postId);
  }

  @HttpPost(':id/stats')
  @HttpCode(200)
  async increasePostStats(
    @Param('id', MongoIdValidationPipe) id: string,
    @Body() increasePostStatsDto: IncreasePostStatsDto,
  ): Promise<void> {
    await this.postsService.increasePostStats(
      id,
      increasePostStatsDto.statType,
    );
  }

  @UseGuards(ApiKeyGuard)
  @Get(':postNumber')
  async findOne(@Param('postNumber') postNumber: string): Promise<Post> {
    const post =
      await this.postsService.findByPostNumberAndIncreasePostView(postNumber);
    return post;
  }
}
