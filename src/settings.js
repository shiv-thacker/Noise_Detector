import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import React, {useState} from 'react';

const Settings = ({navigation, route}) => {
  const {audioDataHistory} = route.params;
  const [noisethreshold, setNoisethreshold] = useState();
  console.log('audiodatahistory', audioDataHistory);
  const onShare = async item => {
    try {
      const shareOptions = {
        message: `DeviceName: ${item.DeviceName}\nRecorded Duration: ${
          item.recordedDuration
        }\nNoise Data: ${item.noiseData.join(', ')}`,
      };
      const result = await Share.share(shareOptions);
      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          console.log('Shared via:', result.activityType);
        } else {
          console.log('Shared');
        }
      } else if (result.action === Share.dismissedAction) {
        console.log('Share dismissed');
      }
    } catch (error) {
      console.error('Error sharing:', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={{backgroundColor: '#DDDDDD'}}>
        <TouchableOpacity
          style={{left: 10, position: 'absolute', top: 10}}
          onPress={() => {
            if (noisethreshold < -1 && noisethreshold > -160) {
              navigation.navigate('MainPage', {noisethreshold: noisethreshold});
              console.log('thresholdvalue', noisethreshold);
            } else if (!noisethreshold) {
              navigation.navigate('MainPage', {noisethreshold: noisethreshold});
              console.log('thresholdvalue', noisethreshold);
            } else {
              Alert.alert('Please set noise threshold properly');
            }
          }}>
          <Image
            source={require('./assets/previous.png')}
            style={{
              height: 50,
              width: 50,
            }}
          />
        </TouchableOpacity>

        <Text
          style={{color: 'black', fontSize: 25, margin: 17, marginLeft: 70}}>
          Settings
        </Text>
      </View>
      <View
        style={{
          margin: 10,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'flex-start',
        }}>
        <Text style={{color: 'black', fontSize: 20}}>
          Set Your Noise Threshold:
        </Text>
        <TextInput
          style={{
            width: 90,
            borderWidth: 2,
            borderColor: 'grey',
            marginHorizontal: 10,
            borderRadius: 5,
            textAlign: 'center',
            textAlignVertical: 'center',
          }}
          placeholder="-1 to -160"
          value={noisethreshold}
          onChangeText={hii => setNoisethreshold(hii)}
        />
      </View>

      <Text
        style={{
          fontSize: 20,
          color: 'black',
          fontWeight: '500',
          marginTop: 20,
          padding: 10,
        }}>
        History:-
      </Text>
      <FlatList
        data={audioDataHistory}
        keyExtractor={(data, index) => index.toString()}
        renderItem={({item}) => (
          <View
            style={{
              padding: 10,
              width: '100%',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
            <View>
              <Text style={{color: 'black', fontSize: 17}}>
                DeviceName: {item.DeviceName}
              </Text>
              <Text style={{color: 'black'}}>
                Recorded Duration: {item.recordedDuration}
              </Text>
              <Text style={{color: 'red'}}>Noise Data:</Text>
              <FlatList
                data={item.noiseData}
                renderItem={({item: noiseItem}) => (
                  <Text style={{color: 'red'}}>{noiseItem}</Text>
                )}
                keyExtractor={(noiseItem, index) => index.toString()}
              />
            </View>
            <TouchableOpacity onPress={() => onShare(item)}>
              <Image
                source={require('./assets/share.png')}
                style={{
                  height: 40,
                  width: 40,
                  marginRight: 10,
                }}
              />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
};

export default Settings;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
});
