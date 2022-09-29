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
RCT_EXPORT_VIEW_PROPERTY(onMapDragEnded, RCTDirectEventBlock)

- (UIView *)view
{
  _mapView = [[KakaoMapView alloc] initWithFrame:CGRectMake(0, 0, CGRectGetWidth(_mapView.frame), CGRectGetHeight(_mapView.frame))];
  _mapView.delegate = self;
  _mapView.baseMapType = MTMapTypeStandard;
  
  return _mapView;
}

RCT_CUSTOM_VIEW_PROPERTY(initialRegion, NSDictionary , KakaoMapView) {
  double latitude = 37.48496;
  double longitude  = 127.03447;

  if ([json valueForKey:@"latitude"] != [NSNull null]) {
    latitude = [[json valueForKey:@"latitude"] floatValue];
  }

  if ([json valueForKey:@"longitude"] != [NSNull null]) {
    longitude = [[json valueForKey:@"longitude"] floatValue];
  }
  
  [_mapView setMapCenterPoint:[MTMapPoint mapPointWithGeoCoord:MTMapPointGeoMake(latitude, longitude)] zoomLevel:_mapView.zoomLevel animated:YES];
  
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

RCT_CUSTOM_VIEW_PROPERTY(isTracking, NSBool , KakaoMapView)
{
    if (json) {
      [_mapView setCurrentLocationTrackingMode:MTMapCurrentLocationTrackingOnWithoutHeading];
      [_mapView setShowCurrentLocationMarker:YES];
      [_mapView updateCurrentLocationMarker:nil];
    } else {
      [_mapView setCurrentLocationTrackingMode:MTMapCurrentLocationTrackingOff];
    }
}

- (void)mapView:(MTMapView*)mapView finishedMapMoveAnimation:(MTMapPoint*)mapCenterPoint {
    id event = @{
                 @"action": @"mapDragEnded",
                 @"coordinate": @{
                         @"latitude": @(mapCenterPoint.mapPointGeo.latitude),
                         @"longitude": @(mapCenterPoint.mapPointGeo.longitude)
                        },
                 };
    if (_mapView.onMapDragEnded) _mapView.onMapDragEnded(event);
}

@end
