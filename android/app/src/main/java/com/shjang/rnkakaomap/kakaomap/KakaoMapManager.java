package com.shjang.rnkakaomap.kakaomap;

import android.widget.RelativeLayout;

import androidx.annotation.NonNull;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ViewGroupManager;
import com.facebook.react.uimanager.ThemedReactContext;

public class KakaoMapManager extends ViewGroupManager<RelativeLayout> {
    public static final String REACT_CLASS = "KakaoMap";
    private ReactApplicationContext mContext;

    @NonNull
    @Override
    public String getName() {
        return REACT_CLASS;
    }

    public KakaoMapManager(ReactApplicationContext context){
        super();
        mContext = context;
    }

    @NonNull
    @Override
    protected KakaoMapView createViewInstance(@NonNull ThemedReactContext reactContext) {
        return new KakaoMapView(reactContext, mContext);
    }
}
