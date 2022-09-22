//
//  KakaoMapManager.m
//  rnKakaoMap
//
//  Created by sicc on 2022/09/21.
//

#import "KakaoMapView.h"
#import "KakaoMapManager.h"

@implementation KakaoMapManager

RCT_EXPORT_MODULE(KakaoMap)

- (UIView *)view
{
  KakaoMapView *_mapView = [KakaoMapView new];
  _mapView = [[KakaoMapView alloc] initWithFrame:CGRectMake(0, 0, CGRectGetWidth(_mapView.frame), CGRectGetHeight(_mapView.frame))];
  _mapView.delegate = self;
  _mapView.baseMapType = MTMapTypeStandard;
  
  return _mapView;
}

@end
