import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  TextInput,
  FlatList,
} from 'react-native';
import React, {useState} from 'react';

const Settings = ({navigation, route}) => {
  const {audioData} = route.params;
  const [noisethreshold, setNoisethreshold] = useState();
  return (
    <View style={styles.container}>
      <View style={{backgroundColor: '#DDDDDD'}}>
        <TouchableOpacity
          style={{left: 10, position: 'absolute', top: 10}}
          onPress={() => {
            navigation.navigate('MainPage', {noisethreshold: noisethreshold});
            console.log('thresholdvalue', noisethreshold);
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

      <Text>Recorded Duration: {audioData.recordedDuration}</Text>
      <Text>Noise Data:</Text>
      <FlatList
        data={audioData.noiseData}
        renderItem={({item}) => <Text>{item}</Text>}
        keyExtractor={(item, index) => index.toString()}
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
