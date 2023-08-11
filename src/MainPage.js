import AudioRecorderPlayer, {
  AVEncoderAudioQualityIOSType,
  AVEncodingOption,
  AudioEncoderAndroidType,
  AudioSourceAndroidType,
  OutputFormatAndroidType,
} from 'react-native-audio-recorder-player';
import {
  Dimensions,
  PermissionsAndroid,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Vibration,
  ScrollView,
  FlatList,
  Image,
  BackHandler,
  Alert,
  TextInput,
} from 'react-native';
import React, {Component} from 'react';

import Button from '../components/uis/Button';
import RNFetchBlob from 'rn-fetch-blob';
import {scale, verticalScale, moderateScale} from 'react-native-size-matters';
import {request, PERMISSIONS, check, RESULTS} from 'react-native-permissions';

const screenWidth = Dimensions.get('screen').width;

class MainPage extends Component {
  dirs = RNFetchBlob.fs.dirs;
  path = Platform.select({
    ios: undefined,
    android: undefined,

    // Discussion: https://github.com/hyochan/react-native-audio-recorder-player/discussions/479
    // ios: 'https://firebasestorage.googleapis.com/v0/b/cooni-ebee8.appspot.com/o/test-audio.mp3?alt=media&token=d05a2150-2e52-4a2e-9c8c-d906450be20b',
    // ios: 'https://staging.media.ensembl.fr/original/uploads/26403543-c7d0-4d44-82c2-eb8364c614d0',
    // ios: 'hello.m4a',
    // android: `${this.dirs.CacheDir}/hello.mp3`,
  });

  constructor(props) {
    super(props);
    const {route, navigation} = this.props;
    const thresholdValue = route.params?.noisethreshold || -6;
    this.state = {
      isLoggingIn: false,
      recordSecs: 0,
      recordDb: 0,
      recordTime: '00:00:00',
      currentDB: '-160',
      currentPositionSec: 0,
      currentMeteringSec: 0,
      currentDurationSec: 0,
      playTime: '00:00:00',
      duration: '00:00:00',
      setQuite: true,
      setNormal: false,
      setLoud: false,
      backgroundColor: 'white',
      noiseData: [],
      noisethreshold: thresholdValue,
      audioDataHistory: [], // Initialize an empty array for storing audio data history
      deviceName: '',
    };

    this.audioRecorderPlayer = new AudioRecorderPlayer();
    this.audioRecorderPlayer.setSubscriptionDuration(0.1); // optional. Default is 0.5
  }
  handleBackPress = () => {
    Alert.alert(
      'Exit App',
      'Are you sure you want to exit?',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Exit', onPress: () => BackHandler.exitApp()},
      ],
      {cancelable: false},
    );
    return true; // Prevent default behavior
  };
  handleInputChange = text => {
    this.setState({
      deviceName: text, // Update the state when the TextInput value changes
    });
  };

  componentDidMount() {
    BackHandler.addEventListener('hardwareBackPress', this.handleBackPress);
  }

  componentWillUnmount() {
    BackHandler.removeEventListener('hardwareBackPress', this.handleBackPress);
  }
  componentDidUpdate(prevProps) {
    if (
      prevProps.route.params?.noisethreshold !==
      this.props.route.params?.noisethreshold
    ) {
      this.setState({
        noisethreshold: this.props.route.params?.noisethreshold || -6,
      });
    }
  }
  render() {
    const {route, navigation} = this.props;
    let textColor = 'grey'; // Default text color
    let backgroundColor = 'white';

    if (this.state.setNormal) {
      textColor = 'green';
    } else if (this.state.setLoud) {
      textColor = 'red';
      backgroundColor = 'red';
    }

    let playWidth =
      (this.state.currentPositionSec / this.state.currentDurationSec) *
      (screenWidth - moderateScale(56));

    if (!playWidth) {
      playWidth = 0;
    }

    return (
      <SafeAreaView
        style={[
          styles.container,
          {backgroundColor: this.state.backgroundColor},
        ]}>
        <TouchableOpacity
          style={{
            justifyContent: 'flex-end',
            width: '100%',
            alignItems: 'flex-end',
            marginTop: verticalScale(12),
            right: scale(12),
          }}
          onPress={() =>
            navigation.navigate('Settings', {
              audioDataHistory: this.state.audioDataHistory, // Pass the array of audio data history
            })
          }>
          <Image
            source={require('./assets/gear.png')}
            style={{
              height: verticalScale(35),
              width: scale(35),
            }}
          />
        </TouchableOpacity>
        <View style={styles.container2}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: verticalScale(20),
              justifyContent: 'flex-start',
              padding: moderateScale(5),
              width: '100%',
              marginTop: verticalScale(5),
            }}>
            <Text style={{color: 'black', fontSize: scale(17)}}>
              Device Name:
            </Text>
            <TextInput
              style={{
                width: scale(150),
                borderBottomWidth: scale(2),
                borderColor: 'grey',
                marginHorizontal: scale(10),
                textAlign: 'center',
                textAlignVertical: 'center',
                fontSize: scale(15),
                color: 'black',
              }}
              placeholder="Servo motor"
              value={this.state.deviceName} // Set the value of TextInput from state
              onChangeText={this.handleInputChange}
            />
          </View>
          <View style={{flexDirection: 'row'}}>
            <Text style={styles.txtDB}>{this.state.currentDB} </Text>
            <Text style={styles.txtDB}>DB</Text>
          </View>
          <Text style={styles.txtofdbstatus}>
            threshold : {this.state.noisethreshold} DB
          </Text>
          <Text style={styles.titleTxt}>Noise Detector</Text>
          <Text style={styles.txtRecordCounter}>{this.state.recordTime}</Text>
          <View style={styles.viewRecorder}>
            <View style={styles.recordBtnWrapper}>
              <Button
                style={styles.btntesting}
                onPress={this.onStartRecord}
                textStyle={styles.txttesting}>
                Start Testing
              </Button>
              <Button
                style={[
                  styles.btn,
                  {
                    marginLeft: scale(12),
                  },
                ]}
                onPress={this.onPauseRecord}
                textStyle={styles.txt}>
                Pause
              </Button>
              <Button
                style={[
                  styles.btn,
                  {
                    marginLeft: scale(12),
                  },
                ]}
                onPress={this.onResumeRecord}
                textStyle={styles.txt}>
                Resume
              </Button>
              <Button
                style={[styles.btn, {marginLeft: scale(12)}]}
                onPress={this.onStopRecord}
                textStyle={styles.txt}>
                Stop
              </Button>
            </View>
            <Text
              style={{
                color: 'black',
                marginTop: verticalScale(30),
                fontSize: scale(20),
              }}>
              Noise Data
            </Text>
            {this.state.noiseData.length == 0 ? (
              <Text
                style={{
                  color: 'grey',
                  fontSize: scale(20),
                  padding: moderateScale(7),
                }}>
                no noise data fetched
              </Text>
            ) : (
              <FlatList
                style={{height: verticalScale(100)}}
                data={this.state.noiseData}
                renderItem={({item}) => {
                  return (
                    <View
                      style={{
                        flexDirection: 'row',
                        width: '100%',
                        margin: moderateScale(5),
                        padding: moderateScale(5),
                        justifyContent: 'flex-start',
                        backgroundColor: 'blue',
                      }}>
                      <Text
                        style={{
                          color: 'white',
                          fontSize: scale(15),
                          padding: moderateScale(5),
                        }}>
                        noise fetched at :
                      </Text>
                      <Text
                        style={{
                          color: 'red',
                          fontSize: scale(15),
                          padding: moderateScale(5),
                        }}>
                        {item}
                      </Text>
                    </View>
                  );
                }}
                keyExtractor={item => item.toString()}
              />
            )}
          </View>
          <View style={styles.viewPlayer}>
            <TouchableOpacity
              style={styles.viewBarWrapper}
              onPress={this.onStatusPress}>
              <View style={styles.viewBar}>
                <View style={[styles.viewBarPlay, {width: playWidth}]} />
              </View>
            </TouchableOpacity>
            <Text style={styles.txtCounter}>
              {this.state.playTime} / {this.state.duration}
            </Text>
            <View style={styles.playBtnWrapper}>
              <Button
                style={styles.btnreplay}
                onPress={this.onStartPlay}
                textStyle={styles.txtreplay}>
                RePlay Track
              </Button>
              <Button
                style={[
                  styles.btn,
                  {
                    marginLeft: scale(12),
                  },
                ]}
                onPress={this.onPausePlay}
                textStyle={styles.txt}>
                Pause
              </Button>
              <Button
                style={[
                  styles.btn,
                  {
                    marginLeft: scale(12),
                  },
                ]}
                onPress={this.onResumePlay}
                textStyle={styles.txt}>
                Resume
              </Button>
              <Button
                style={[
                  styles.btn,
                  {
                    marginLeft: scale(12),
                  },
                ]}
                onPress={this.onStopPlay}
                textStyle={styles.txt}>
                Stop
              </Button>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  onStatusPress = e => {
    const touchX = e.nativeEvent.locationX;
    console.log(`touchX: ${touchX}`);

    const touchY = e.nativeEvent.locationY;
    console.log(`touchX: ${touchY}`);

    const playWidth =
      (this.state.currentPositionSec / this.state.currentDurationSec) *
      (screenWidth - 56);
    console.log(`currentPlayWidth: ${playWidth}`);

    const currentPosition = Math.round(this.state.currentPositionSec);
    const currentMetering = Math.round(this.state.currentMeteringSec);

    if (playWidth && playWidth < touchX) {
      const addSecs = Math.round(currentPosition + 1000);
      this.audioRecorderPlayer.seekToPlayer(addSecs);
      console.log(`addSecs: ${addSecs}`);
    } else {
      const subSecs = Math.round(currentPosition - 1000);
      this.audioRecorderPlayer.seekToPlayer(subSecs);
      console.log(`subSecs: ${subSecs}`);
    }
  };

  onStartRecord = async () => {
    if (Platform.OS === 'android') {
      try {
        const storageWriteStatus = await request(
          PERMISSIONS.ANDROID.WRITE_EXTERNAL_STORAGE,
        );
        const storageReadStatus = await request(
          PERMISSIONS.ANDROID.READ_EXTERNAL_STORAGE,
        );
        const recordAudioStatus = await request(
          PERMISSIONS.ANDROID.RECORD_AUDIO,
        );

        console.log('Storage Write Permission:', storageWriteStatus);
        console.log('Storage Read Permission:', storageReadStatus);
        console.log('Record Audio Permission:', recordAudioStatus);

        if (
          storageWriteStatus === RESULTS.GRANTED &&
          storageReadStatus === RESULTS.GRANTED &&
          recordAudioStatus === RESULTS.GRANTED
        ) {
          console.log('All required permissions granted');
        } else {
          console.log('Not all required permissions granted');
        }
      } catch (error) {
        console.error('Error requesting permissions:', error);
      }
    }

    const audioSet = {
      AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
      AudioSourceAndroid: AudioSourceAndroidType.MIC,
      AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.high,
      AVNumberOfChannelsKeyIOS: 2,
      AVFormatIDKeyIOS: AVEncodingOption.aac,
      OutputFormatAndroid: OutputFormatAndroidType.AAC_ADTS,
    };

    console.log('audioSet', audioSet);
    const meteringEnabled = true;
    const uri = await this.audioRecorderPlayer.startRecorder(
      this.path,
      audioSet,
      meteringEnabled,
    );
    this.setState({noiseData: []}), // Clear the noiseData array
      this.audioRecorderPlayer.addRecordBackListener(e => {
        console.log('record-back', e);

        this.setState({
          recordSecs: e.currentPosition,
          recordDb: e.currentMetering,
          recordTime: this.audioRecorderPlayer.mmssss(
            Math.floor(e.currentPosition),
          ),
          currentDB: e.currentMetering,
        });
        if (e.currentMetering > this.state.noisethreshold) {
          // Change background color to red and add to realTimeValues
          this.setState(
            prevState => ({
              backgroundColor: 'red',
              noiseData: [...prevState.noiseData, this.state.recordTime],
            }),
            () => {
              // Set a timer to revert the background color after 1 second
              setTimeout(() => {
                this.setState({
                  backgroundColor: 'white',
                });
              }, 300);
            },
          );
        }
      });
    console.log(`uri: ${uri}`);
  };

  onPauseRecord = async () => {
    try {
      const r = await this.audioRecorderPlayer.pauseRecorder();
      console.log(r);
    } catch (err) {
      console.log('pauseRecord', err);
    }
  };

  onResumeRecord = async () => {
    await this.audioRecorderPlayer.resumeRecorder();
  };

  onStopRecord = async () => {
    const result = await this.audioRecorderPlayer.stopRecorder();
    this.audioRecorderPlayer.removeRecordBackListener();

    const recordedDuration = this.audioRecorderPlayer.mmssss(
      Math.floor(this.state.recordSecs),
    );

    // Construct the data object to be passed to Settings screen
    const newAudioData = {
      DeviceName: this.state.deviceName,
      recordedDuration: this.state.recordTime,
      noiseData: this.state.noiseData,
    };
    this.setState(prevState => ({
      audioDataHistory: [...prevState.audioDataHistory, newAudioData],
      recordSecs: 0,
      playTime: '00:00:00',
      duration: recordedDuration,
      recordTime: '00:00:00',
    }));

    console.log(result);
  };

  onStartPlay = async () => {
    console.log('onStartPlay', this.path);

    try {
      const msg = await this.audioRecorderPlayer.startPlayer(this.path);

      //? Default path
      // const msg = await this.audioRecorderPlayer.startPlayer();
      const volume = await this.audioRecorderPlayer.setVolume(1.0);
      console.log(`path: ${msg}`, `volume: ${volume}`);

      this.audioRecorderPlayer.addPlayBackListener(e => {
        console.log('playBackListener', e);
        this.setState({
          currentPositionSec: e.currentPosition,
          currentDurationSec: e.duration,
          currentMeteringSec: e.currentMetering,
          playTime: this.audioRecorderPlayer.mmssss(
            Math.floor(e.currentPosition),
          ),
          duration: this.audioRecorderPlayer.mmssss(Math.floor(e.duration)),
        });
      });
    } catch (err) {
      console.log('startPlayer error', err);
    }
  };

  onPausePlay = async () => {
    await this.audioRecorderPlayer.pausePlayer();
  };

  onResumePlay = async () => {
    await this.audioRecorderPlayer.resumePlayer();
  };

  onStopPlay = async () => {
    console.log('onStopPlay');
    this.audioRecorderPlayer.stopPlayer();
    this.audioRecorderPlayer.removePlayBackListener();
    this.setState({playTime: '00:00:00', currentPositionSec: 0}); // Reset playTime)
  };
}

export default MainPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },

  container2: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleTxt: {
    marginTop: verticalScale(15),
    color: 'black',
    fontSize: scale(24),
  },
  txtDB: {
    color: 'black',
    fontSize: scale(35),
    fontWeight: '600',
  },
  viewRecorder: {
    marginTop: verticalScale(17),
    width: '100%',
    alignItems: 'center',
  },
  recordBtnWrapper: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
  },
  viewPlayer: {
    marginTop: verticalScale(17),
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  viewBarWrapper: {
    marginTop: verticalScale(17),
    marginHorizontal: scale(28),
    alignSelf: 'stretch',
  },
  viewBar: {
    backgroundColor: 'grey',
    height: verticalScale(4),
    alignSelf: 'stretch',
  },
  viewBarPlay: {
    backgroundColor: 'red',
    height: verticalScale(4),
    width: scale(0),
  },
  playStatusTxt: {
    marginTop: verticalScale(8),
    color: 'black',
  },
  playBtnWrapper: {
    flexDirection: 'row',
    marginTop: verticalScale(25),
  },
  btn: {
    borderColor: 'gray',
    borderWidth: scale(1),
  },
  btntesting: {
    borderColor: 'grey',
    borderWidth: scale(1),
    backgroundColor: 'green',
  },
  btnreplay: {
    borderColor: 'grey',
    borderWidth: scale(1),
    backgroundColor: 'orange',
  },
  txt: {
    color: 'black',
    fontSize: scale(14),
    marginHorizontal: scale(8),
    marginVertical: verticalScale(4),
  },
  txttesting: {
    color: 'white',
    fontSize: scale(14),
    marginHorizontal: scale(8),
    marginVertical: verticalScale(4),
  },
  txtreplay: {
    color: 'white',
    fontSize: scale(14),
    marginHorizontal: scale(8),
    marginVertical: verticalScale(4),
  },
  txtRecordCounter: {
    marginTop: verticalScale(20),
    color: 'red',
    fontSize: scale(20),
    textAlignVertical: 'center',
    fontWeight: '200',
    fontFamily: 'Helvetica Neue',
    letterSpacing: scale(3),
  },
  txtofdbstatus: {
    marginTop: verticalScale(1),
    fontSize: scale(17),
    textAlignVertical: 'center',
    fontWeight: '200',
    fontFamily: 'Helvetica Neue',
    letterSpacing: scale(3),
    color: 'grey',
  },
  txtCounter: {
    marginTop: verticalScale(12),
    color: 'red',
    fontSize: scale(20),
    textAlignVertical: 'center',
    fontWeight: '200',
    fontFamily: 'Helvetica Neue',
    letterSpacing: scale(3),
  },
});
