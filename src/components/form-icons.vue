<template>
  <div class="form-item-info input icons" type="text">
    <span
      class="icon"
      :class="{'selected-icon': icon === selectedIcon}"
      v-for="icon in icons"
      :key="icon"
      @click="onChangeIcon(icon)"
    >
      <i :class="`fa fa-${icon}`" />
    </span>
  </div>
</template>

<script>
export default {
  name: "form-icons",
  props: {
    icons: {
      type: Array,
      required: true
    },
    selectedIcon: {
      type: String,
      default: ''
    }
  },
  data() {
    return {}
  },
  methods: {
    onChangeIcon(icon) {
      this.$emit('setIcon', icon)
    }
  }
}
</script>

<style lang="scss">
@import '../style/main.scss'

</style>


