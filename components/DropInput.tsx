import { MAIN_BACKGROUND, PROFILE_ICON, PROFILE_TEXT, SEPARATOR } from '@/lib/constants'
import { InsertUserSunscreen } from '@/lib/userSunscreen'
import { RefObject, useEffect, useRef, useState } from 'react'
import { Keyboard, Pressable, Text, View } from 'react-native'
import { Dropdown, IDropdownRef } from 'react-native-element-dropdown'
import { ms, ScaledSheet } from 'react-native-size-matters'

let pendingDropdown: {
  ref: RefObject<IDropdownRef | null>
  setIsPending: (value: boolean) => void
} | null = null

interface DropInputProps<Key extends keyof InsertUserSunscreen> {
  type: Key
  data: {
    label: string
    value: InsertUserSunscreen[Key]
  }[]
  initValue: InsertUserSunscreen[Key]
  setField: (key: Key, value: InsertUserSunscreen[Key]) => void
  fontSize?: number
  fontWeight?: 400 | 500 | 600
}

function DropInputComponent<Key extends keyof InsertUserSunscreen>({
  type,
  data,
  initValue,
  setField,
  fontSize = 15,
  fontWeight = 400,
}: DropInputProps<Key>) {
  const [value, setValue] = useState<InsertUserSunscreen[Key]>(initValue)
  const [isPending, setIsPending] = useState(false)
  const dropdownRef = useRef<IDropdownRef>(null)

  useEffect(() => {
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      if (pendingDropdown?.ref === dropdownRef) {
        pendingDropdown = null
        dropdownRef.current?.open()
        setIsPending(false)
      }
    })

    return () => hideSub.remove()
  }, [])

  const renderItem = (item: { label: string; value: InsertUserSunscreen[Key] }) => {
    return item.value === value ? (
      <View style={styles.itemSelect}>
        <Text
          style={[
            styles.itemSelectText,
            { fontSize: ms(fontSize), fontWeight: fontWeight },
          ]}
        >
          {item.label}
        </Text>
      </View>
    ) : (
      <View style={styles.item}>
        <Text
          style={[styles.itemText, { fontSize: ms(fontSize), fontWeight: fontWeight }]}
        >
          {item.label}
        </Text>
      </View>
    )
  }

  useEffect(() => {
    setValue(initValue)
  }, [initValue])

  return (
    <Pressable onPress={() => dropdownRef.current?.open()}>
      <Dropdown
        ref={dropdownRef}
        style={styles.infoValue}
        iconStyle={{ width: ms(fontSize + 2), height: ms(fontSize + 2) }}
        selectedTextStyle={[
          styles.selectedText,
          isPending && styles.selectedTextPending,
          { fontSize: ms(fontSize), fontWeight: fontWeight },
        ]}
        containerStyle={styles.dropdownContainer}
        activeColor={SEPARATOR}
        data={data}
        value={value}
        onChange={(item) => {
          setValue(item.value)
          setField(type, item.value)
        }}
        labelField="label"
        valueField="value"
        renderItem={renderItem}
        onFocus={() => {
          if (Keyboard.isVisible()) {
            if (pendingDropdown && pendingDropdown.ref !== dropdownRef) {
              pendingDropdown.setIsPending(false)
            }
            pendingDropdown = { ref: dropdownRef, setIsPending }
            setIsPending(true)
            dropdownRef.current?.close()
            Keyboard.dismiss()
          }
        }}
        placeholder="Select item"
        placeholderStyle={[
          styles.selectedText,
          isPending && styles.selectedTextPending,
          { fontSize: ms(fontSize), fontWeight: fontWeight },
        ]}
        maxHeight={ms(155)}
        autoScroll={false}
      />
    </Pressable>
  )
}

export default DropInputComponent

const styles = ScaledSheet.create({
  infoValue: {
    paddingInline: '5@s',
    paddingBlock: '4@s',
    borderWidth: 1,
    borderColor: SEPARATOR,
    borderRadius: 3,
  },

  selectedText: {
    color: PROFILE_ICON,
  },

  selectedTextPending: {
    opacity: 0.5,
  },

  dropdownContainer: {
    backgroundColor: MAIN_BACKGROUND,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: SEPARATOR,
    borderRadius: 3,
  },

  item: {
    paddingBlock: '7@s',
    paddingInlineStart: '5@s',
  },

  itemText: {
    color: PROFILE_ICON,
  },

  itemSelect: {
    paddingBlock: '7@s',
    paddingInlineStart: '5@s',
    backgroundColor: MAIN_BACKGROUND,
    opacity: 0.8,
  },

  itemSelectText: {
    color: PROFILE_TEXT,
  },
})
