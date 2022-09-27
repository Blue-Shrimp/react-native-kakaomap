//
//  KakaoMapManager.m
//  rnKakaoMap
//
//  Created by sicc on 2022/09/21.
//

#import "KakaoMapView.h"
#import "KakaoMapManager.h"

@interface KakaoMapManager () {
  KakaoMapView *_mapView;
}

@end

@implementation KakaoMapManager

RCT_EXPORT_MODULE(KakaoMap)

- (UIView *)view
{
  _mapView = [[KakaoMapView alloc] initWithFrame:CGRectMake(0, 0, CGRectGetWidth(_mapView.frame), CGRectGetHeight(_mapView.frame))];
  _mapView.delegate = self;
  _mapView.baseMapType = MTMapTypeStandard;
  
  return _mapView;
}

RCT_CUSTOM_VIEW_PROPERTY(initialRegion, NSDictionary , KakaoMapView) {
  double latitude = 36.143099;
  double longitude  = 128.392905;
  NSInteger zoomLevel = 0;

  if ([json valueForKey:@"latitude"] != [NSNull null]) {
    latitude = [[json valueForKey:@"latitude"] floatValue];
  }

  if ([json valueForKey:@"longitude"] != [NSNull null]) {
    longitude = [[json valueForKey:@"longitude"] floatValue];
  }

  if ([json valueForKey:@"zoomLevel"] != [NSNull null]) {
    zoomLevel = [[json valueForKey:@"zoomLevel"] intValue];
  }
  
  [_mapView setMapCenterPoint:[MTMapPoint mapPointWithGeoCoord:MTMapPointGeoMake(latitude, longitude)] zoomLevel:zoomLevel animated:YES];
  
}

RCT_CUSTOM_VIEW_PROPERTY(markers, NSArray , KakaoMapView)
{
  NSMutableArray *markerList = [[NSMutableArray alloc] init];
  
  for (int i = 0; i < [json count]; i++) {
    NSDictionary *dictionary = [json objectAtIndex:i];
    NSString *imageName = [dictionary valueForKey:@"markerImage"];

    float latdouble = [[dictionary valueForKey:@"latitude"] floatValue];
    float londouble = [[dictionary valueForKey:@"longitude"] floatValue];

    MTMapPOIItem* marker = [MTMapPOIItem poiItem];
    
    marker.itemName = dictionary[@"id"];
    marker.mapPoint = [MTMapPoint mapPointWithGeoCoord:MTMapPointGeoMake(latdouble, londouble)];
    marker.markerType = MTMapPOIItemMarkerTypeCustomImage;
    marker.customImageName = imageName;
    
    [markerList addObject:marker];
  }
  
  [_mapView addPOIItems: markerList];
}

@end
