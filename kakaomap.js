import React from 'react'
import { requireNativeComponent } from 'react-native'
import PropTypes from 'prop-types'

const Map = requireNativeComponent('KakaoMap', MapView)

const MapView = props => {
  const _onMapDragEnded = event => {
    if (!props.onMapDragEnded) {
      return
    }
    props.onMapDragEnded(event.nativeEvent)
  }

  const _onMarkerSelect = event => {
    if (!props.onMapDragEnded) {
      return
    }
    props.onMarkerSelect(event.nativeEvent)
  }

  const _onMapTouch = event => {
    if (!props.onMapTouch) {
      return
    }
    props.onMapTouch(event.nativeEvent)
  }

  return <Map {...props} onMapDragEnded={_onMapDragEnded} onMarkerSelect={_onMarkerSelect} onMapTouch={_onMapTouch} />
}

MapView.propTypes = {
  markers: PropTypes.any,
  initialRegion: PropTypes.any,
  isTracking: PropTypes.bool,
  selectPoiTag: PropTypes.string,
  onMapDragEnded: PropTypes.func,
  onMarkerSelect: PropTypes.func,
  onMapTouch: PropTypes.func,
}

export default MapView
