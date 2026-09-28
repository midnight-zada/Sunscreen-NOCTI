import { Image } from 'expo-image'
import { Dispatch, SetStateAction } from 'react'
import { Modal, Pressable, StyleSheet } from 'react-native'

interface ViewImageProps {
  isFocused: boolean
  setIsFocused: Dispatch<SetStateAction<boolean>>
  source: string | null
}

const ImageViewer = ({ isFocused, setIsFocused, source }: ViewImageProps) => {
  return (
    <Modal
      visible={isFocused}
      transparent
      animationType="fade"
      onRequestClose={() => setIsFocused(false)}
    >
      <Pressable style={styles.imageModalBackdrop} onPress={() => setIsFocused(false)}>
        <Image
          source={source ? source : require('../assets/images/placeholder.jpg')}
          style={styles.imageModalImage}
          contentFit="contain"
        />
      </Pressable>
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
