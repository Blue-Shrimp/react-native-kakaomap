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
  ScrollView,
  ActionSheetIOS,
  ActivityIndicator,
  Dimensions,
} from 'react-native'
import MapView from './kakaomap'
import Geolocation from 'react-native-geolocation-service'
import { check, request, openSettings, PERMISSIONS, RESULTS } from 'react-native-permissions'
import Animated from 'react-native-reanimated'
import BottomSheet from 'reanimated-bottom-sheet'
import Preference from 'react-native-preference'
import { DatePicker } from '@davidgovea/react-native-wheel-datepicker'
import Modal from 'react-native-modal'
import 'react-native-gesture-handler'
import { launchImageLibrary, launchCamera } from 'react-native-image-picker'
import storage from '@react-native-firebase/storage'
import firestore from '@react-native-firebase/firestore'
import ImageZoom from 'react-native-image-pan-zoom'
import Video from 'react-native-video'

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
  const [detailText, setDetailText] = useState('')
  const [currentFile, setCurrentFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [videoLoading, setVideoLoading] = useState(false)
  const [isImgModal, setIsImgModal] = useState(false)
  const [isVideoModal, setIsVideoModal] = useState(false)
  const player = useRef(null)
  const [fileResponseList, setFileResponseList] = useState([])

  const markerCollenction = firestore().collection('users')

  const sheetRef = useRef(null)

  useEffect(() => {
    AppState.addEventListener('change', handleAppStateChange)
    _requestPermission()
    _downloadMarker()
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
      detail: selectMarker.detail,
      fileUrlList: selectMarker.fileUrlList,
    }
    setLocation(current)
    setSearchPlace(placeData)
    setMarkerDate(selectMarker.time)
    setPickerDate(selectMarker.time)
    setTitleText(selectMarker.title)
    setDetailText(selectMarker.detail)
    setFileResponseList(selectMarker.fileUrlList)
    sheetRef.current.snapTo(1)
  }

  const _onMapTouch = event => {
    Keyboard.dismiss()
    setIsSearch(false)
    setFileResponseList([])
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

  const _onChangeDetail = text => {
    setDetailText(text)
  }

  const _onSearch = async () => {
    Keyboard.dismiss()
    setFileResponseList([])
    sheetRef.current.snapTo(2)

    if (searchText === '') {
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
      kakaoGeocodeUrl + '?page=1&size=10&sort=accuracy&x=' + myLocation.longitude + '&y=' + myLocation.latitude + '&query=' + keyword,
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
      detail: '',
      fileUrlList: [],
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

  const _downloadMarker = async () => {
    setLoading(true)
    try {
      const data = await markerCollenction.doc('ABC').get()
      console.log(data?._data?.markerData)
      setMarkerDatas(data?._data?.markerData)
      setLoading(false)
    } catch (error) {
      setLoading(false)
      console.log(error.message)
    }
  }

  const _uploadMarker = async markers => {
    try {
      await markerCollenction.doc('ABC').set({ markerData: markers })
      console.log('Create Complete!')
    } catch (error) {
      console.log(error.message)
    }
  }

  const _uploadFileList = async () => {
    let imageUrl = ''
    let videoUrl = ''
    try {
      const result = await Promise.all(
        fileResponseList.map(async item => {
          if (item.uri.includes('firebasestorage')) {
            return item
          } else {
            if (item.type.includes('image')) {
              const reference = storage().ref(`/image/${item.fileName}`) // 업로드할 경로 지정
              await reference.putFile(item.uri)
              imageUrl = await reference.getDownloadURL()
              console.log('imageUrl', imageUrl)
              const itemImage = { type: item.type, fileName: item.fileName, uri: imageUrl }
              return itemImage
            } else {
              const reference = storage().ref(`/video/${item.fileName}`) // 업로드할 경로 지정
              await reference.putFile(item.uri)
              videoUrl = await reference.getDownloadURL()
              console.log('videoUrl', videoUrl)
              const itemVideo = { type: item.type, fileName: item.fileName, uri: videoUrl }
              return itemVideo
            }
          }
        }),
      )
      return result
    } catch (error) {
      console.log('errororroro : ', error)
    }
  }

  const markerSave = async () => {
    setLoading(true)
    let fileList = []
    if (fileResponseList.length > 0) {
      fileList = await _uploadFileList()
    }
    let marker = markerDatas.filter(v => v.tag === searchPlace.id)[0]
    marker = {
      ...marker,
      title: titleText,
      search: false,
      save: true,
      time: markerDate,
      detail: detailText,
      fileUrlList: fileList,
    }
    let others = markerDatas.filter(v => v.tag !== searchPlace.id)
    setMarkerDatas([...others, marker])
    await _uploadMarker([...others, marker])
    setFileResponseList([])
    sheetRef.current.snapTo(2)
    setLoading(false)
  }

  const markerModify = async () => {
    setLoading(true)
    let fileList = []
    if (fileResponseList.length > 0) {
      fileList = await _uploadFileList()
    }
    let marker = markerDatas.filter(v => v.tag === searchPlace.id)[0]
    marker = { ...marker, title: titleText, time: markerDate, detail: detailText, fileUrlList: fileList }
    let others = markerDatas.filter(v => v.tag !== searchPlace.id)
    setMarkerDatas([...others, marker])
    await _uploadMarker([...others, marker])
    setFileResponseList([])
    sheetRef.current.snapTo(2)
    setLoading(false)
  }

  const markerDelete = async () => {
    setLoading(true)
    const deleteMarkers = markerDatas
      .filter(v => v.tag !== searchPlace.id)
      .reduce((result = [], value) => {
        result.push({
          ...value,
          search: false,
        })

        return result
      }, [])
    setMarkerDatas(deleteMarkers)
    await _uploadMarker(deleteMarkers)
    setFileResponseList([])
    sheetRef.current.snapTo(2)
    setLoading(false)
  }

  const _preView = item => {
    if (item.type.includes('image')) {
      return (
        <Image
          style={styles.preivew}
          source={{ uri: item.uri }}
          onLoadStart={() => setLoading(true)}
          onLoadEnd={() => setLoading(false)}
          onError={error => {
            console.log('error : ', error)
            setLoading(false)
          }}
        />
      )
    } else {
      return (
        <Video
          source={{ uri: item.uri }}
          ref={player}
          paused={true}
          style={styles.preivew}
          resizeMode={'stretch'}
          onLoadStart={() => {
            setVideoLoading(true)
          }}
          onLoad={() => {
            setVideoLoading(false)
            player?.current.seek(0) // 로드가 완료되었을떄 첫 프레임이 썸네일처럼 보임
          }}
          onError={error => {
            console.log('error : ', error)
            setVideoLoading(false)
          }}
        />
      )
    }
  }

  const _modalOpen = () => {
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['사진 촬영하기', '동영상 촬영하기', '앨범에서 선택하기', '취소'],
        cancelButtonIndex: 3,
      },
      buttonIndex => {
        if (buttonIndex === 0) {
          _onImageCamera()
        } else if (buttonIndex === 1) {
          _onVideoCamera()
        } else if (buttonIndex === 2) {
          _onSelectImage()
        }
      },
    )
  }

  const _onImageCamera = async () => {
    console.log('fileResponseList : ', fileResponseList)
    setLoading(true)
    const options = {
      mediaType: 'photo',
      presentationStyle: 'fullScreen',
      includeExtra: true,
      maxWidth: 1024,
      maxHeight: 1024,
    }
    const result = await launchCamera(options)
    console.log(result)
    setLoading(false)
    if (result?.assets === undefined) return
    if (currentFile !== null) {
      const modify = fileResponseList.reduce((list = [], value) => {
        if (value.fileName === currentFile.fileName) {
          list.push({
            ...value,
            type: result?.assets[0]?.type,
            fileName: result?.assets[0]?.fileName,
            uri: result?.assets[0]?.uri,
          })
        } else {
          list.push({
            ...value,
          })
        }

        return list
      }, [])
      setFileResponseList(modify)
    } else {
      setFileResponseList(
        fileResponseList.concat({
          type: result?.assets[0]?.type,
          fileName: result?.assets[0]?.fileName,
          uri: result?.assets[0]?.uri,
        }),
      )
    }
    setCurrentFile(null)
  }

  const _onVideoCamera = async () => {
    console.log('fileResponseList : ', fileResponseList)
    setLoading(true)
    const options = {
      mediaType: 'video',
      presentationStyle: 'fullScreen',
      includeExtra: true,
      videoQuality: 'medium',
    }
    const result = await launchCamera(options)
    console.log(result)
    setLoading(false)
    if (result?.assets === undefined) return
    if (currentFile !== null) {
      const modify = fileResponseList.reduce((list = [], value) => {
        if (value.fileName === currentFile.fileName) {
          list.push({
            ...value,
            type: result?.assets[0]?.type,
            fileName: result?.assets[0]?.fileName,
            uri: result?.assets[0]?.uri,
          })
        } else {
          list.push({
            ...value,
          })
        }

        return list
      }, [])
      setFileResponseList(modify)
    } else {
      setFileResponseList(
        fileResponseList.concat({
          type: result?.assets[0]?.type,
          fileName: result?.assets[0]?.fileName,
          uri: result?.assets[0]?.uri,
        }),
      )
    }
    setCurrentFile(null)
  }

  const _onSelectImage = async () => {
    console.log('fileResponseList : ', fileResponseList)
    setLoading(true)
    const options = {
      mediaType: 'mixed',
      presentationStyle: 'fullScreen',
      includeExtra: true,
      maxWidth: 1024,
      maxHeight: 1024,
    }
    const result = await launchImageLibrary(options)
    console.log(result)
    setLoading(false)
    if (result?.assets === undefined) return
    if (currentFile !== null) {
      const modify = fileResponseList.reduce((list = [], value) => {
        if (value.fileName === currentFile.fileName) {
          list.push({
            ...value,
            type: result?.assets[0]?.type,
            fileName: result?.assets[0]?.fileName,
            uri: result?.assets[0]?.uri,
          })
        } else {
          list.push({
            ...value,
          })
        }

        return list
      }, [])
      setFileResponseList(modify)
    } else {
      setFileResponseList(
        fileResponseList.concat({
          type: result?.assets[0]?.type,
          fileName: result?.assets[0]?.fileName,
          uri: result?.assets[0]?.uri,
        }),
      )
    }
    setCurrentFile(null)
  }

  const _renderHeader = () => {
    return loading || videoLoading ? null : (
      <View style={styles.header}>
        <View style={styles.panelHeader}>
          <View style={styles.panelHandle} />
        </View>
        <View style={styles.modifyContainer}>
          <TouchableOpacity
            onPress={() => {
              searchPlace?.isSave ? markerModify() : markerSave()
              Keyboard.dismiss()
            }}
            style={styles.modify}>
            <Text style={styles.modifyText}>{searchPlace?.isSave ? '수정' : '저장'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              markerDelete()
              Keyboard.dismiss()
            }}
            style={styles.delete}>
            <Text style={styles.modifyText}>삭제</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const _loadingView = () => (
    <View style={styles.loadingView}>
      <ActivityIndicator size={'large'} color="red" />
    </View>
  )

  const _fileView = () => {
    return (
      <ScrollView horizontal={true}>
        {fileResponseList?.length > 0
          ? fileResponseList.map(item => {
              return (
                <TouchableOpacity
                  onPress={() => {
                    if (item.type.includes('image')) {
                      setCurrentFile(item)
                      setIsImgModal(true)
                    } else {
                      setCurrentFile(item)
                      setIsVideoModal(true)
                    }
                  }}
                  style={styles.fileView}
                  key={item.fileName}>
                  {_preView(item)}
                </TouchableOpacity>
              )
            })
          : null}
        <TouchableOpacity onPress={() => _modalOpen()}>
          <View style={styles.fileAddView}>
            <Text style={styles.plusText}>+</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    )
  }

  const _renderContent = () => {
    return (
      <ScrollView style={styles.bottomContent}>
        <TextInput
          style={styles.titleText}
          onChangeText={_onChangeTitle}
          autoCapitalize={'none'}
          autoCorrect={false}
          textAlignVertical={'center'}
          textAlign={'center'}
          underlineColorAndroid={'transparent'}
          keyboardType={'default'}
          keyboardAppearance={'default'}
          value={titleText}
          onFocus={() => sheetRef.current.snapTo(0)}
        />
        <View style={styles.addressView}>
          <Text>장소</Text>
          <View style={styles.addressViewContainer}>
            <Image style={styles.markerImage} source={require('./images/marker.png')} />
            <Text style={styles.addressText}>{searchPlace?.address_name}</Text>
          </View>
        </View>
        <View style={styles.dateView}>
          <Text>방문일자</Text>
          <TouchableOpacity
            onPress={() => {
              setModalVisible(true)
            }}
            style={styles.dateViewContainer}>
            <Text>{markerDate}</Text>
          </TouchableOpacity>
        </View>
        <TextInput
          style={styles.detail}
          onFocus={() => sheetRef.current.snapTo(0)}
          multiline={true}
          placeholder={'추억을 기록해보세요.'}
          placeholderTextColor={'black'}
          onChangeText={_onChangeDetail}
          value={detailText}
          autoCapitalize={'none'}
          autoCorrect={false}
          keyboardType={'default'}
          keyboardAppearance={'default'}
          textAlignVertical={'center'}
        />
        <View style={styles.fileViewContainer}>{_fileView()}</View>
        {loading || videoLoading ? _loadingView() : null}
      </ScrollView>
    )
  }

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.screen}>
        <MapView
          style={styles.mapview}
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
              setFileResponseList([])
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
          style={styles.dateModal}
          backdropTransitionOutTiming={0}
          onBackdropPress={() => {
            setModalVisible(false)
            setPickerDate(markerDate)
          }}>
          <DatePicker
            style={styles.datePicker}
            date={new Date(pickerDate)}
            mode="date"
            use12Hours
            maximumDate={new Date()}
            onDateChange={date => {
              setPickerDate(date.toISOString().substring(0, 10))
            }}
          />
          <View style={styles.dateModalView}>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false)
                setPickerDate(markerDate)
              }}>
              <Text style={styles.dateModalText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setModalVisible(false)
                setMarkerDate(pickerDate)
              }}>
              <Text style={styles.dateModalText}>확인</Text>
            </TouchableOpacity>
          </View>
        </Modal>
        <Modal
          isVisible={isImgModal}
          style={styles.modal}
          backdropTransitionOutTiming={0}
          onBackdropPress={() => {
            setCurrentFile(null)
            setIsImgModal(false)
          }}>
          <View style={styles.modalView}>
            <TouchableOpacity>
              <Text
                style={styles.modalText}
                onPress={() => {
                  setCurrentFile(null)
                  setIsImgModal(false)
                }}>
                X
              </Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text
                style={styles.modalText}
                onPress={() => {
                  ActionSheetIOS.showActionSheetWithOptions(
                    {
                      options: ['수정하기', '삭제하기', '취소'],
                      cancelButtonIndex: 2,
                    },
                    buttonIndex => {
                      if (buttonIndex === 0) {
                        setIsImgModal(false)
                        setTimeout(() => {
                          _modalOpen()
                        }, 500)
                      } else if (buttonIndex === 1) {
                        setFileResponseList(fileResponseList.filter(v => v.fileName !== currentFile.fileName))
                        setCurrentFile(null)
                        setIsImgModal(false)
                      }
                    },
                  )
                }}>
                ...
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContainer}>
            {currentFile === null ? null : (
              <ImageZoom
                cropWidth={Dimensions.get('window').width - 40}
                cropHeight={Dimensions.get('window').height - 120}
                imageWidth={Dimensions.get('window').width - 40}
                imageHeight={Dimensions.get('window').height - 120}>
                <Image
                  style={styles.imageModalContent}
                  resizeMode={'contain'}
                  source={{ uri: currentFile?.uri }}
                  onLoadStart={() => setLoading(true)}
                  onLoadEnd={() => setLoading(false)}
                  onError={error => {
                    console.log('error : ', error)
                    setLoading(false)
                  }}
                />
              </ImageZoom>
            )}
          </View>
          {loading || videoLoading ? (
            <View style={styles.loadingViewBlack}>
              <ActivityIndicator size={'large'} color="red" />
            </View>
          ) : null}
        </Modal>

        <Modal
          isVisible={isVideoModal}
          style={styles.modal}
          backdropTransitionOutTiming={0}
          onBackdropPress={() => {
            setCurrentFile(null)
            setIsVideoModal(false)
          }}>
          <View style={styles.modalView}>
            <TouchableOpacity>
              <Text
                style={styles.modalText}
                onPress={() => {
                  setCurrentFile(null)
                  setIsVideoModal(false)
                }}>
                X
              </Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text
                style={styles.modalText}
                onPress={() => {
                  ActionSheetIOS.showActionSheetWithOptions(
                    {
                      options: ['수정하기', '삭제하기', '취소'],
                      cancelButtonIndex: 2,
                    },
                    buttonIndex => {
                      if (buttonIndex === 0) {
                        setIsVideoModal(false)
                        setTimeout(() => {
                          _modalOpen()
                        }, 500)
                      } else if (buttonIndex === 1) {
                        setFileResponseList(fileResponseList.filter(v => v.fileName !== currentFile.fileName))
                        setCurrentFile(null)
                        setIsVideoModal(false)
                      }
                    },
                  )
                }}>
                ...
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContainer}>
            {currentFile === null ? null : (
              <Video
                source={{ uri: currentFile?.uri }}
                style={styles.videoModalContent}
                controls={true}
                fullscreen={true}
                onLoadStart={() => setVideoLoading(true)}
                onLoad={() => setVideoLoading(false)}
                onError={error => {
                  console.log('error : ', error)
                  setVideoLoading(false)
                }}
              />
            )}
          </View>
          {loading || videoLoading ? (
            <View style={styles.loadingViewBlack}>
              <ActivityIndicator size={'large'} color="red" />
            </View>
          ) : null}
        </Modal>
      </SafeAreaView>
      {loading || videoLoading ? (
        <View style={styles.mapLoadingView}>
          <ActivityIndicator size={'large'} color="red" />
        </View>
      ) : null}
      <BottomSheet ref={sheetRef} snapPoints={['70%', '48%', 0]} initialSnap={2} renderHeader={_renderHeader} renderContent={_renderContent} />
    </>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  mapview: { flex: 1 },
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
  header: {
    backgroundColor: 'white',
    paddingTop: 10,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  panelHeader: {
    alignItems: 'center',
    marginBottom: 5,
  },
  panelHandle: {
    width: 57,
    height: 4,
    borderRadius: 4,
    backgroundColor: 'gray',
  },
  preivew: { width: 125, height: 125 },
  modifyContainer: { flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 16 },
  modify: { borderBottomWidth: 0.3, paddingBottom: 5, marginRight: 5 },
  modifyText: { fontSize: 16 },
  delete: { borderBottomWidth: 0.3, paddingBottom: 5 },
  mapLoadingView: {
    position: 'absolute',
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'gray',
    opacity: 0.5,
  },
  loadingView: {
    backgroundColor: 'white',
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  loadingViewBlack: {
    backgroundColor: 'black',
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
  },
  fileView: { marginTop: 10, borderWidth: 1, borderColor: 'gray', marginRight: 5 },
  fileAddView: { marginTop: 10, borderWidth: 1, borderColor: 'gray', width: 125, height: 125, justifyContent: 'center' },
  plusText: { alignSelf: 'center', color: 'gray', fontSize: 30 },
  bottomContent: {
    backgroundColor: 'white',
    padding: 16,
    minHeight: '100%',
  },
  titleText: { borderBottomWidth: 0.3, alignSelf: 'center', width: '100%', fontSize: 22, paddingBottom: 8, fontWeight: 'bold' },
  addressView: { flexDirection: 'row', marginTop: 10, justifyContent: 'space-between' },
  addressViewContainer: { flexDirection: 'row' },
  markerImage: {
    width: 12,
    height: 12,
    alignSelf: 'center',
    marginRight: 3,
  },
  addressText: { textAlign: 'center' },
  dateView: { flexDirection: 'row', marginTop: 10, justifyContent: 'space-between' },
  dateViewContainer: { borderBottomWidth: 0.3, alignSelf: 'center', paddingBottom: 5 },
  detail: { borderWidth: 0.5, borderColor: 'gray', marginTop: 15, minHeight: 80, color: 'black', paddingVertical: 5, paddingHorizontal: 5 },
  fileViewContainer: { flexDirection: 'row' },
  dateModal: { flex: 1, justifyContent: 'center' },
  datePicker: { width: '100%', backgroundColor: 'gray' },
  dateModalView: {
    width: '100%',
    backgroundColor: 'gray',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 0.5,
    borderTopColor: 'white',
    paddingTop: 10,
  },
  dateModalText: { color: 'white', fontSize: 20, fontWeight: 'bold', marginRight: 10, marginBottom: 5 },
  modal: { flex: 1, backgroundColor: 'black', paddingTop: 30 },
  modalView: { flexDirection: 'row', marginHorizontal: 10, justifyContent: 'space-between' },
  modalText: { color: 'white', fontSize: 30, fontWeight: 'bold' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  imageModalContent: { width: '100%', height: '100%' },
  videoModalContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
})

export default APP
