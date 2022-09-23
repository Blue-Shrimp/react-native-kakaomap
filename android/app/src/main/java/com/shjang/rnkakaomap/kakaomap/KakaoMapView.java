package com.shjang.rnkakaomap.kakaomap;

import android.content.Context;
import android.util.AttributeSet;
import android.view.LayoutInflater;
import android.view.ViewGroup;

import android.widget.RelativeLayout;

import net.daum.mf.map.api.MapLayout;
import net.daum.mf.map.api.MapPoint;
import net.daum.mf.map.api.MapPOIItem;
import net.daum.mf.map.api.MapView;

import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.uimanager.ThemedReactContext;
import com.shjang.rnkakaomap.R;

public class KakaoMapView extends RelativeLayout {
    private Context context;
    private ReactApplicationContext rContext;

    public KakaoMapView(ThemedReactContext context, ReactApplicationContext mContext) {
        super(context);
        this.rContext = mContext;
        this.context = context;
        initView(context, null);
    }

    private void initView(Context context, AttributeSet attrs){
        inflate(context, R.layout.kakaomapview, this);

        MapView mapView = new MapView(rContext.getCurrentActivity());

        ViewGroup mapViewContainer = (ViewGroup) findViewById(R.id.kakao_map_view);
        mapViewContainer.addView(mapView);
    }

}
