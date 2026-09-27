import { MAIN_BACKGROUND, PROFILE_ICON, PROFILE_TEXT, SEPARATOR } from '@/lib/constants'
import { InsertUserSunscreen } from '@/lib/userSunscreen'
import { useEffect, useState } from 'react'
import { Text, View } from 'react-native'
import { Dropdown } from 'react-native-element-dropdown'
import { ms, ScaledSheet } from 'react-native-size-matters'

interface DropInputProps<Key extends keyof InsertUserSunscreen> {
  type: Key
  data: {
    label: string
    value: InsertUserSunscreen[Key]
  }[]
  initValue: InsertUserSunscreen[Key]
  setField: (key: Key, value: InsertUserSunscreen[Key]) => void
}

function DropInputComponent<Key extends keyof InsertUserSunscreen>({
  type,
  data,
  initValue,
  setField,
}: DropInputProps<Key>) {
  const [value, setValue] = useState<InsertUserSunscreen[Key]>(initValue)

  const renderItem = (item: { label: string; value: InsertUserSunscreen[Key] }) => {
    return item.value === value ? (
      <View style={styles.itemSelect}>
        <Text style={styles.itemSelectText}>{item.label}</Text>
      </View>
    ) : (
      <View style={styles.item}>
        <Text style={styles.itemText}>{item.label}</Text>
      </View>
    )
  }

  useEffect(() => {
    setValue(initValue)
  }, [initValue])

  return (
    <Dropdown
      style={styles.infoValue}
      selectedTextStyle={styles.selectedText}
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
      placeholder="Select item"
      placeholderStyle={styles.selectedText}
      maxHeight={ms(155)}
      autoScroll={false}
    />
  )
}

export default DropInputComponent

const styles = ScaledSheet.create({
  infoValue: {
    paddingInline: '5@s',
    paddingBlock: '3.1@s',
    borderWidth: 1,
    borderColor: SEPARATOR,
    borderRadius: 3,
  },

  selectedText: {
    fontSize: '16@ms',
    fontWeight: 500,
    color: PROFILE_ICON,
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
    fontSize: '16@ms',
    fontWeight: 500,
    color: PROFILE_ICON,
  },

  itemSelect: {
    paddingBlock: '7@s',
    paddingInlineStart: '5@s',
    backgroundColor: MAIN_BACKGROUND,
    opacity: 0.8,
  },

  itemSelectText: {
    fontSize: '16@ms',
    fontWeight: 500,
    color: PROFILE_TEXT,
  },
})
