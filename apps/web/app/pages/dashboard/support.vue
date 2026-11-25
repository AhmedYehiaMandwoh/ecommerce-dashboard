<script setup lang="ts">
const { busy, loadAccountTools, replyTicket, ticketReply, tickets, user } = useMarket();
onMounted(() => { if (user.value?.role === "ADMIN") loadAccountTools(); });
</script>

<template>
  <div v-if="user.role === 'ADMIN'" class="space-y-4">
    <div class="flex items-center justify-between"><h2 class="text-lg font-extrabold">دعم العملاء</h2><Button variant="outline" size="sm" @click="loadAccountTools">تحديث الرسائل</Button></div>
    <p v-if="!tickets.length" class="text-muted-foreground">لا توجد رسائل دعم.</p>
    <div class="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3 [&>*]:min-w-0">
      <Card v-for="t in tickets" :key="t.id" class="space-y-2 p-5">
        <h3 class="font-extrabold">{{ t.subject }}</h3><p class="text-sm">{{ t.message }}</p>
        <img v-if="t.attachment" :src="t.attachment" alt="مرفق" class="max-h-48 rounded-lg border" />
        <form class="space-y-2 border-t pt-3" @submit.prevent="replyTicket(t)">
          <Label>رد الدعم</Label><Textarea v-model="ticketReply(t).reply" required minlength="5" maxlength="2000" />
          <Label>حالة رسالة الدعم</Label>
          <Select v-model="ticketReply(t).state"><SelectTrigger class="w-full"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="OPEN">مفتوحة</SelectItem><SelectItem value="CLOSED">مغلقة</SelectItem></SelectContent></Select>
          <Button type="submit" class="w-full" :disabled="busy">حفظ رد الدعم</Button>
        </form>
      </Card>
    </div>
  </div>
  <p v-else class="text-muted-foreground">هذه الصفحة للإدارة فقط.</p>
</template>
