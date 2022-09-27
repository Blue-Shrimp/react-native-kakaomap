import React from 'react'
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native'
import MapView from './kakaomap'

const APP = () => {
  const currentLocation = {
    latitude: 37.48496,
    longitude: 127.03417,
    zoomLevel: 0,
  }
  const markerDatas = [
    { id: '1', latitude: 37.48496, longitude: 127.03427, markerImage: 'pinMarker' },
    { id: '2', latitude: 37.48496, longitude: 127.03437, markerImage: 'pinMarker' },
    { id: '3', latitude: 37.48496, longitude: 127.03447, markerImage: 'pinMarker' },
  ]
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.screen}>
        <MapView style={{ flex: 1 }} initialRegion={currentLocation} markers={markerDatas} />
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
})

export default APP
