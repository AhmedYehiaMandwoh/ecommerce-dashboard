<script setup lang="ts">
const { cart, category, go, load, search, shops, view } = useMarket();
</script>

<template>
    <ReferenceHome :shops="shops" :cart-count="cart.reduce((s: number, i: any) => s + i.quantity, 0)" @navigate="go" @search="(q: string) => { search = q; go('shops'); load(); }" @category="(q: string) => { category = q; go('shops'); load(); }" />
</template>
