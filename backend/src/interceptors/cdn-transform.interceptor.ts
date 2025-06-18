import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { transformImageUrlsInResponse } from '../utils/cdn.util';

@Injectable()
export class CdnTransformInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(data => {
        // Transformar URLs de imagens para CDN
        return transformImageUrlsInResponse(data);
      }),
    );
  }
} 