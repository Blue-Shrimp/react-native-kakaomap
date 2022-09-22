import React from 'react'
import { requireNativeComponent } from 'react-native'
import PropTypes from 'prop-types'

const Map = requireNativeComponent('KakaoMap', MapView)

const MapView = props => {
  return <Map {...props} />
}

MapView.propTypes = {}

export default MapView
