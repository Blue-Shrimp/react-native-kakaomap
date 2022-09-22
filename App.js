import React from 'react'
import { SafeAreaView, StatusBar, StyleSheet } from 'react-native'
import MapView from './kakaomap'

const APP = () => {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.screen}>
        <MapView style={{ flex: 1 }} />
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
