<template>
    <div id="map">

    </div>
    <div id="tiptemplate"></div>
</template>

<script setup lang="ts">
import { useTemplateRef } from 'vue'
import { useMtkMap } from '../hooks/mtk-map'

const { map } = useMtkMap()

</script>

<style scoped>
#map {
    width: 100vw;
    height: 100vh;
}
</style>