import { Image } from 'expo-image'
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react'
import { Animated, Modal, Pressable, StyleSheet } from 'react-native'

interface ViewImageProps {
  isFocused: boolean
  setIsFocused: Dispatch<SetStateAction<boolean>>
  source: string | null
}

const ImageViewer = ({ isFocused, setIsFocused, source }: ViewImageProps) => {
  const opacity = useRef(new Animated.Value(0)).current
  const [modalVisible, setModalVisible] = useState(isFocused)

  useEffect(() => {
    if (isFocused) {
      setModalVisible(true)
    } else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 100,
        useNativeDriver: true,
      }).start(() => setModalVisible(false))
    }
  }, [isFocused, opacity])

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType='none'
      onShow={() => {
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start()
      }}
      onRequestClose={() => setIsFocused(false)}
    >
      <Animated.View style={[styles.imageModalBackdrop, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setIsFocused(false)} />
        <Image
          source={source ? source : require('../assets/images/placeholder.jpg')}
          style={styles.imageModalImage}
          contentFit="contain"
        />
      </Animated.View>
    </Modal>
  )
}

export default ImageViewer

const styles = StyleSheet.create({
  imageModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  imageModalImage: {
    width: '94%',
    aspectRatio: 1,
    borderRadius: 70,
  },
})
