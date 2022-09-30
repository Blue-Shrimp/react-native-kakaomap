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

  return <Map {...props} onMapDragEnded={_onMapDragEnded} onMarkerSelect={_onMarkerSelect} />
}

MapView.propTypes = {
  markers: PropTypes.any,
  initialRegion: PropTypes.any,
  isTracking: PropTypes.bool,
  onMapDragEnded: PropTypes.func,
  onMarkerSelect: PropTypes.func,
}

export default MapView
