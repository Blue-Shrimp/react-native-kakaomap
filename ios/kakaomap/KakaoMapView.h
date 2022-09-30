//
//  KakaoMapView.h
//  rnKakaoMap
//
//  Created by sicc on 2022/09/21.
//

#import <UIKit/UIKit.h>
#import <DaumMap/MTMapView.h>

#if __has_include(<React/RCTBridge.h>)
#import <React/RCTBridge.h>
#import <React/UIView+React.h>
#import <React/RCTEventDispatcher.h>
#elif __has_include("RCTBridge.h")
#import "RCTBridge.h"
#import "UIView+React.h"
#import "RCTEventDispatcher.h"
#else
#import "React/RCTBridge.h" // Required when used as a Pod in a Swift project
#import "React/UIView+React.h"
#import <React/RCTComponent.h>
#import "React/RCTEventDispatcher.h"
#endif

@class RCTEventDispatcher;

@interface KakaoMapView : MTMapView

@property (nonatomic, copy) RCTDirectEventBlock onMapDragEnded;
@property (nonatomic, copy) RCTDirectEventBlock onMarkerSelect;

@end
