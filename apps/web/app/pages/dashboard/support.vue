<script setup lang="ts">
const { busy, dashboardTab, loadAccountTools, replyTicket, ticketReply, tickets, user } = useMarket();
</script>

<template>
  <div>
        <section v-if="dashboardTab==='support' && user.role==='ADMIN'"><h2>دعم العملاء</h2><button class="alt" @click="loadAccountTools">تحميل رسائل الدعم</button><div v-for="t in tickets" :key="t.id" class="card section-gap"><h3>{{t.subject}}</h3><p>{{t.message}}</p><form class="form" @submit.prevent="replyTicket(t)"><label>رد الدعم<textarea v-model="ticketReply(t).reply" required minlength="5" maxlength="2000"/></label><label>حالة رسالة الدعم<select v-model="ticketReply(t).state"><option value="OPEN">مفتوحة</option><option value="CLOSED">مغلقة</option></select></label><button :disabled="busy">حفظ رد الدعم</button></form></div></section>
  </div>
</template>
