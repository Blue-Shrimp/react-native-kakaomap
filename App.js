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
import Animated from 'react-native-reanimated'
import BottomSheet from 'reanimated-bottom-sheet'
import Preference from 'react-native-preference'
import { DatePicker } from '@davidgovea/react-native-wheel-datepicker'
import Modal from 'react-native-modal'

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
  const [markerDatas, setMarkerDatas] = useState([])
  const [searchPlace, setSearchPlace] = useState({})
  const [titleText, setTitleText] = useState('')
  const [isModalVisible, setModalVisible] = useState(false)
  const [pickerDate, setPickerDate] = useState(new Date().toISOString().substring(0, 10))
  const [markerDate, setMarkerDate] = useState(new Date().toISOString().substring(0, 10))

  const sheetRef = useRef(null)

  useEffect(() => {
    AppState.addEventListener('change', handleAppStateChange)
    _requestPermission()
    setMarkerDatas(Preference.get('markerData') || [])
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
    const { latitude, longitude } = event.coordinate
    const current = {
      latitude: latitude,
      longitude: longitude,
    }
    setLocation(current)
  }

  const _onMarkerSelect = event => {
    Keyboard.dismiss()
    setIsSearch(false)
    const current = {
      latitude: event.coordinate.latitude,
      longitude: event.coordinate.longitude,
    }
    const selectMarker = markerDatas.find(v => v.tag === event.tag.toString())
    const placeData = {
      id: selectMarker.tag,
      place_name: selectMarker.title,
      address_name: selectMarker.info.address,
      isSave: selectMarker.save,
      time: selectMarker.time,
    }
    setLocation(current)
    setSearchPlace(placeData)
    setMarkerDate(selectMarker.time)
    setPickerDate(selectMarker.time)
    setTitleText(selectMarker.title)
    sheetRef.current.snapTo(1)
  }

  const _onMapTouch = event => {
    Keyboard.dismiss()
    setIsSearch(false)
    sheetRef.current.snapTo(2)
    setMarkerDatas(markerDatas.filter(v => v.save === true))
  }

  const _onChangeText = async text => {
    setSearchText(text)
    if (text === '') {
      return
    }
    const placeList = await getAddressByKeyword(text)
    setPlace(placeList)
    if (placeList?.length > 0) {
      setIsSearch(true)
    } else {
      setIsSearch(false)
    }
  }

  const _onChangeTitle = text => {
    setTitleText(text)
  }

  const _onSearch = async () => {
    Keyboard.dismiss()
    sheetRef.current.snapTo(2)

    if (text === '') {
      return
    }

    const placeList = await getAddressByKeyword(searchText)
    setPlace(placeList)
    if (placeList?.length > 0) {
      setIsSearch(true)
    } else {
      setIsSearch(false)
    }
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
      'https://dapi.kakao.com/v2/local/search/keyword.json?page=1&size=10&sort=accuracy&x=' +
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
    return (
      <View style={styles.searchContainer}>
        <TouchableOpacity style={styles.searchItem} onPress={() => _addMarker(item)}>
          <Text style={styles.place}>{item.place_name}</Text>
          <Text style={styles.address}>{item.address_name}</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const _addMarker = item => {
    setIsSearch(false)
    Keyboard.dismiss()
    setSearchPlace(item)
    const prevMarkers = [...markerDatas]
    const placeMarker = {
      tag: item.id,
      title: item.place_name,
      info: { address: item.address_name },
      latitude: Number(item.y),
      longitude: Number(item.x),
      markerImage: 'marker',
      markerSelectImage: 'markerSel',
      search: true,
      save: false,
      time: new Date().toISOString().substring(0, 10),
    }
    setMarkerDatas(
      prevMarkers.concat(placeMarker).reduce((result = [], value) => {
        if (!result.includes(value) && result.filter(item => item['tag'] === value['tag']).length <= 0) {
          result.push(value)
        }

        return result
      }, []),
    )
    const current = {
      latitude: Number(item.y),
      longitude: Number(item.x),
    }

    setLocation(current)
    if (prevMarkers.length !== markerDatas.length) {
      sheetRef.current.snapTo(1)
    }
  }

  const markerSave = () => {
    setMarkerDatas(
      markerDatas.reduce((result = [], value) => {
        result.push({
          ...value,
          title: titleText,
          search: false,
          save: true,
          time: markerDate,
        })
        Preference.set('markerData', result)
        return result
      }, []),
    )
    sheetRef.current.snapTo(2)
  }

  const markerModify = () => {
    let marker = markerDatas.filter(v => v.tag === searchPlace.id)[0]
    marker = { ...marker, title: titleText, time: markerDate }
    let others = markerDatas.filter(v => v.tag !== searchPlace.id)
    setMarkerDatas([...others, marker])
    Preference.set('markerData', [...others, marker])
    sheetRef.current.snapTo(2)
  }

  const markerDelete = () => {
    setMarkerDatas(
      markerDatas
        .filter(v => v.tag !== searchPlace.id)
        .reduce((result = [], value) => {
          result.push({
            ...value,
            search: false,
          })

          Preference.set('markerData', result)
          return result
        }, []),
    )
    sheetRef.current.snapTo(2)
  }

  const _renderContent = () => {
    return (
      <View
        style={{
          backgroundColor: 'white',
          padding: 16,
          minHeight: '100%',
        }}>
        <TextInput
          style={{ borderBottomWidth: 1 }}
          onChangeText={_onChangeTitle}
          autoCapitalize={'none'}
          autoCorrect={false}
          textAlignVertical={'center'}
          underlineColorAndroid={'transparent'}
          keyboardType={'default'}
          keyboardAppearance={'default'}
          value={titleText}
        />
        <Text>{searchPlace?.address_name}</Text>
        <TouchableOpacity
          onPress={() => {
            setModalVisible(true)
          }}>
          <Text>{markerDate}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            searchPlace?.isSave ? markerModify() : markerSave()
          }}>
          <Text>{searchPlace?.isSave ? '수정' : '저장'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            markerDelete()
          }}>
          <Text>삭제</Text>
        </TouchableOpacity>
      </View>
    )
  }

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
            onFocus={() => {
              sheetRef.current.snapTo(2)
            }}
          />
          <TouchableWithoutFeedback onPress={_onSearch}>
            <View style={styles.searchButtonContainer}>
              <Image source={require('./images/search.png')} />
            </View>
          </TouchableWithoutFeedback>
        </View>
        <View style={isSearch ? styles.placeListContainer : { display: 'none' }}>
          <FlatList data={place} renderItem={_renderItem} indicatorStyle="black"></FlatList>
        </View>
        <Modal
          isVisible={isModalVisible}
          style={{ flex: 1, justifyContent: 'center' }}
          useNativeDriver={true}
          onBackdropPress={() => {
            setModalVisible(false)
            setPickerDate(markerDate)
          }}>
          <DatePicker
            style={{ width: '100%', backgroundColor: 'gray' }}
            date={new Date(pickerDate)}
            mode="date"
            use12Hours
            onDateChange={date => {
              setPickerDate(date.toISOString().substring(0, 10))
            }}
          />
          <View style={{ width: '100%', backgroundColor: 'gray', flexDirection: 'row', justifyContent: 'flex-end' }}>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false)
                setPickerDate(markerDate)
              }}>
              <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginRight: 10, marginBottom: 5 }}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false)
                setMarkerDate(pickerDate)
              }}>
              <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', marginRight: 10, marginBottom: 5 }}>확인</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </SafeAreaView>
      <BottomSheet ref={sheetRef} snapPoints={['50%', '30%', 0]} initialSnap={2} borderRadius={10} renderContent={_renderContent} />
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
    borderWidth: 1,
    borderRadius: 5,
    borderColor: 'gray',
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
    marginTop: 102,
    maxHeight: 200,
    backgroundColor: 'white',
  },
  searchContainer: {
    backgroundColor: 'white',
    marginHorizontal: 18,
    marginVertical: 6,
    flexDirection: 'row',
    borderBottomWidth: 0.2,
    borderColor: 'gray',
    paddingBottom: 5,
  },
  searchItem: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  place: {
    color: 'black',
    marginBottom: 3,
  },
  address: {
    fontSize: 12,
    color: 'gray',
  },
})

export default APP
