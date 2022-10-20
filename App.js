import React, { useState, useEffect, useRef } from 'react'
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  AppState,
  Platform,
  Alert,
  TouchableOpacity,
  Image,
  View,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  FlatList,
  Text,
} from 'react-native'
import MapView from './kakaomap'
import Geolocation from 'react-native-geolocation-service'
import { check, request, openSettings, PERMISSIONS, RESULTS } from 'react-native-permissions'

const kakaoGeocodeUrl = 'https://dapi.kakao.com/v2/local/search/keyword.json'
const kakaoRestApiKey = '6e1402fdd53ff5da2517db3fb6f6b7b4'

const APP = () => {
  const appState = useRef(AppState.currentState)
  const [location, setLocation] = useState({
    latitude: 37.48496,
    longitude: 127.03447,
    zoomLevel: 0,
  })
  const [myLocation, setMyLocation] = useState({
    latitude: 37.48496,
    longitude: 127.03447,
    zoomLevel: 0,
  })
  const [place, setPlace] = useState([])
  const isTracking = useRef(false)
  const [searchText, setSearchText] = useState('')
  const [isSearch, setIsSearch] = useState(false)

  useEffect(() => {
    AppState.addEventListener('change', handleAppStateChange)
    _requestPermission()
    return () => {
      AppState.removeEventListener('change', handleAppStateChange)
    }
  }, [])

  const handleAppStateChange = nextAppState => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      _requestPermission()
    }
    if (appState.current.match(/inactive|active/) && nextAppState === 'background') {
    }
    appState.current = nextAppState
  }

  const _checkPermission = async () => {
    await check(Platform.select({ ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE, android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION }))
      .then(result => {
        if (result === RESULTS.GRANTED || result === RESULTS.LIMITED) {
          return Promise.resolve({ isGranted: true })
        } else {
          return Promise.reject({
            result: result,
          })
        }
      })
      .catch(error => {
        return Promise.reject({
          result: error,
        })
      })
  }

  const _requestLocation = async () => {
    await request(Platform.select({ ios: PERMISSIONS.IOS.LOCATION_WHEN_IN_USE, android: PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION }))
      .then(result => {
        if (result === RESULTS.GRANTED) {
          return Promise.resolve({ isGranted: true })
        } else {
          return Promise.reject({
            result: result,
          })
        }
      })
      .catch(error => {
        return Promise.reject({
          result: error,
        })
      })
  }

  const _requestPermission = async () => {
    await _checkPermission()
      .then(response => {
        isTracking.current = true
        _getCurrentLocation()
      })
      .catch(error => {
        return _requestLocation()
          .then(response => {
            isTracking.current = true
            _getCurrentLocation()
          })
          .catch(denyError => {
            isTracking.current = false
            _getDefaultLocation()
          })
      })
  }

  const _confirmPermission = async () => {
    return _checkPermission()
      .then(response => {
        return Promise.resolve(true)
      })
      .catch(error => {
        const title = '위치권한 필요'
        const message = '위치권한 동의'
        const buttons = [
          {
            text: '허용 안함',
            onPress: () => {
              _getDefaultLocation()
              return Promise.reject(true)
            },
            style: 'cancel',
          },
          {
            text: '설정 이동',
            onPress: () => {
              openSettings()
              return Promise.reject(false)
            },
          },
        ]
        Alert.alert(title, message, buttons)
      })
  }

  const _getDefaultLocation = () => {
    const latitude = 37.48496
    const longitude = 127.03447
    const current = {
      latitude: latitude,
      longitude: longitude,
    }
    setLocation(current)
  }

  const _getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords
        const current = {
          latitude: latitude,
          longitude: longitude,
        }

        setLocation(current)
        setMyLocation(current)
      },
      error => {
        _confirmPermission()
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 10000,
      },
    )
    return
  }

  const _onPressCurrentLocation = () => {
    _getCurrentLocation()
  }

  const _onMapDragEnded = event => {
    console.log(event)
    const { latitude, longitude } = event.coordinate
    const current = {
      latitude: latitude,
      longitude: longitude,
    }
    setLocation(current)
  }

  const _onMarkerSelect = event => {
    console.log(event)
    setIsSearch(false)
  }

  const _onMapTouch = event => {
    console.log(event)
    setIsSearch(false)
  }

  const _onChangeText = text => {
    setSearchText(text)
  }

  const _onSearch = async () => {
    Keyboard.dismiss()

    const placeList = await getAddressByKeyword(searchText)
    setPlace(placeList)
    if (placeList?.length > 0) {
      setIsSearch(true)
    } else {
      setIsSearch(false)
    }
    console.log(place)
  }

  const getAddressByKeyword = async keyword => {
    let option = {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: 'KakaoAK ' + kakaoRestApiKey,
      },
    }
    return await fetch(
      'https://dapi.kakao.com/v2/local/search/keyword.json?page=1&size=5&sort=accuracy&x=' +
        myLocation.longitude +
        '&y=' +
        myLocation.latitude +
        '&query=' +
        keyword,
      option,
    )
      .then(response => {
        if (response.status == 200) {
          return response.json()
        } else {
          console.log('errorerrorerrorerrorerror : ', response)
        }
      })
      .then(responseJson => {
        return responseJson?.documents || []
      })
      .catch(error => {
        console.log('error : ', error)
      })
  }

  const _renderItem = ({ item, index }) => {
    return <Text>{item.place_name}</Text>
  }

  const markerDatas = [
    { tag: '1', title: '맛집', latitude: 37.48496, longitude: 127.03427, markerImage: 'marker', markerSelectImage: 'markerSel' },
    { tag: '2', title: '카페', latitude: 37.48486, longitude: 127.03437, markerImage: 'marker', markerSelectImage: 'markerSel' },
    { tag: '3', title: '장소', latitude: 37.48476, longitude: 127.03447, markerImage: 'marker', markerSelectImage: 'markerSel' },
  ]

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.screen}>
        <MapView
          style={{ flex: 1 }}
          isTracking={isTracking.current}
          initialRegion={location}
          markers={markerDatas}
          onMapDragEnded={event => {
            _onMapDragEnded(event)
          }}
          onMarkerSelect={event => {
            _onMarkerSelect(event)
          }}
          onMapTouch={event => {
            _onMapTouch(event)
          }}
        />
        <TouchableOpacity
          testID={'1515'}
          style={styles.currentLocationContainer}
          activeOpacity={0.5}
          onPress={() => {
            _onPressCurrentLocation()
          }}>
          <Image style={styles.currentLoactionIcon} source={require('./images/gps.png')} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <TextInput
            style={styles.searchGuideText}
            placeholder={'키워드를 입력하세요.'}
            placeholderTextColor={'black'}
            onChangeText={_onChangeText}
            autoCapitalize={'none'}
            autoCorrect={false}
            defaultValue={searchText}
            textAlignVertical={'center'}
            underlineColorAndroid={'transparent'}
            returnKeyType={'search'}
            keyboardType={'default'}
            keyboardAppearance={'default'}
            onSubmitEditing={_onSearch}
            value={searchText}
          />
          <TouchableWithoutFeedback onPress={_onSearch}>
            <View style={styles.searchButtonContainer}>
              <Image source={require('./images/search.png')} />
            </View>
          </TouchableWithoutFeedback>
        </View>
        <View style={isSearch ? styles.placeListContainer : { display: 'none' }}>
          <FlatList data={place} renderItem={_renderItem}></FlatList>
        </View>
      </SafeAreaView>
    </>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  currentLocationContainer: {
    width: 40,
    height: 40,
    position: 'absolute',
    right: 12,
    bottom: 55,
  },
  currentLoactionIcon: {
    width: 40,
    height: 40,
  },
  searchBar: {
    position: 'absolute',
    flexDirection: 'row',
    marginHorizontal: 18,
    marginTop: 60,
    minHeight: 40,
    backgroundColor: 'white',
    borderWidth: 0.1,
    borderRadius: 20,
    borderColor: '#00000010',
  },
  searchGuideText: {
    flex: 1,
    marginLeft: 20,
    marginRight: 5,
    marginVertical: 10,
    backgroundColor: 'transparent',
    color: 'black',
  },
  searchButtonContainer: {
    marginLeft: 5,
    marginRight: 20,
    marginVertical: 10,
    justifyContent: 'center',
  },
  placeListContainer: {
    position: 'absolute',
    flexDirection: 'row',
    marginHorizontal: 18,
    marginTop: 100,
    minHeight: 200,
    backgroundColor: 'white',
  },
})

export default APP
