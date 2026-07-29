<script setup lang="ts">
import './App.css'
import DexGrid from './components/DexGrid.vue'
import QueryBar from './components/QueryBar.vue'
import { t } from './data/i18n.js'
import { cycleMode, lang, mode, toggleLang, tokenStyle } from './state/display.js'
import { results } from './state/query.js'
</script>

<template>
  <view class="Root" :style="tokenStyle">
    <view class="Shell">
      <view class="Screen">
        <view class="Masthead">
          <text class="Title">CHAMPIONS DEX</text>
          <view class="MastheadRow">
            <text class="Sub">{{ results.length }} / 208</text>
            <view class="Chip" @tap="cycleMode">
              <text class="ChipText">{{ mode.id }}</text>
            </view>
            <view class="Chip" @tap="toggleLang">
              <text class="ChipText">{{ t('lang', lang) }}</text>
            </view>
          </view>
        </view>

        <QueryBar />

        <DexGrid :results="results" />
      </view>
    </view>
  </view>
</template>
