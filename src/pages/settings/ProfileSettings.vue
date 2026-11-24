<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Camera, Trash2 } from 'lucide-vue-next'
import { useAuthStore } from '@/stores/auth'
import { useContentStore } from '@/stores/content'
import { useToasts } from '@/composables/useToasts'
import BaseInput from '@/components/ui/BaseInput.vue'
import BaseButton from '@/components/ui/BaseButton.vue'
import BaseAvatar from '@/components/ui/BaseAvatar.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import * as profilesService from '@/services/supabase/profiles'
import * as storageService from '@/services/supabase/storage'

const auth = useAuthStore()
const content = useContentStore()
const toasts = useToasts()

const firstName = ref('')
const lastName = ref('')
const displayName = ref('')
const email = ref('')
const saving = ref(false)
const uploading = ref(false)
const removeAvatarOpen = ref(false)
const removeBusy = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)

const avatarUrl = computed(() => content.profile?.avatar_url ?? null)
const fullName = computed(
  () =>
    [firstName.value, lastName.value].filter(Boolean).join(' ') ||
    displayName.value ||
    email.value ||
    'Account',
)

function fill() {
  firstName.value = content.profile?.first_name ?? ''
  lastName.value = content.profile?.last_name ?? ''
  displayName.value = content.profile?.display_name ?? ''
  email.value = content.profile?.email ?? auth.email ?? ''
}

onMounted(async () => {
  await content.loadProfile()
  fill()
})

async function save() {
  saving.value = true
  try {
    const err = await profilesService.updateProfile(auth.userId ?? '', {
      first_name: firstName.value.trim() || null,
      last_name: lastName.value.trim() || null,
      display_name: displayName.value.trim() || null,
    })
    if (err) throw new Error(err)
    await content.loadProfile()
    toasts.success('Profile updated')
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to save profile.')
  } finally {
    saving.value = false
  }
}

async function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  uploading.value = true
  try {
    const result = await storageService.uploadAvatar(auth.userId ?? '', file)
    if (result.error || !result.url) throw new Error(result.error ?? 'Upload failed.')
    const err = await profilesService.updateProfile(auth.userId ?? '', {
      avatar_url: result.url,
    })
    if (err) throw new Error(err)
    await content.loadProfile()
    toasts.success('Profile picture updated')
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to upload image.')
  } finally {
    uploading.value = false
    input.value = ''
  }
}

async function removeAvatar() {
  removeBusy.value = true
  try {
    const err = await storageService.removeAvatar(auth.userId ?? '')
    if (err) throw new Error(err)
    const updateErr = await profilesService.updateProfile(auth.userId ?? '', {
      avatar_url: null,
    })
    if (updateErr) throw new Error(updateErr)
    await content.loadProfile()
    removeAvatarOpen.value = false
    toasts.success('Profile picture removed')
  } catch (e) {
    toasts.error(e instanceof Error ? e.message : 'Failed to remove picture.')
  } finally {
    removeBusy.value = false
  }
}
</script>

<template>
  <div>
    <!-- Avatar -->
    <section class="section">
      <h2 class="section__title">
        Profile picture
      </h2>
      <p class="section__description">
        JPEG, PNG, WebP, or GIF up to 5 MB. Stored securely in Supabase Storage.
      </p>

      <div class="avatar-row">
        <BaseAvatar
          :name="fullName"
          :src="avatarUrl"
          :size="64"
        />
        <div class="avatar-actions">
          <BaseButton
            variant="secondary"
            size="sm"
            :loading="uploading"
            @click="fileInput?.click()"
          >
            <Camera :size="14" />
            {{ avatarUrl ? 'Replace picture' : 'Upload picture' }}
          </BaseButton>
          <BaseButton
            v-if="avatarUrl"
            variant="ghost"
            size="sm"
            @click="removeAvatarOpen = true"
          >
            <Trash2 :size="14" /> Remove
          </BaseButton>
        </div>
        <input
          ref="fileInput"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          class="visually-hidden"
          aria-label="Choose profile picture"
          @change="onFileChange"
        >
      </div>
    </section>

    <!-- Identity -->
    <section class="section">
      <h2 class="section__title">
        Profile
      </h2>
      <p class="section__description">
        How you appear inside Ien.
      </p>

      <form
        class="form"
        @submit.prevent="save"
      >
        <div class="form__grid">
          <BaseInput
            v-model="firstName"
            label="First name"
            placeholder="Ada"
          />
          <BaseInput
            v-model="lastName"
            label="Last name"
            placeholder="Lovelace"
          />
        </div>
        <BaseInput
          v-model="displayName"
          label="Display name"
          placeholder="How should Ien greet you?"
          hint="Used in the dashboard greeting. Falls back to your first name."
        />
        <BaseInput
          v-model="email"
          label="Email"
          type="email"
          disabled
          hint="Email is your sign-in identifier. Change it from Account settings."
        />

        <div class="form__actions">
          <BaseButton
            type="submit"
            variant="primary"
            :loading="saving"
          >
            Save changes
          </BaseButton>
        </div>
      </form>
    </section>

    <ConfirmDialog
      :open="removeAvatarOpen"
      title="Remove profile picture?"
      message="Your avatar will revert to your initials."
      confirm-label="Remove"
      :loading="removeBusy"
      @close="removeAvatarOpen = false"
      @confirm="removeAvatar"
    />
  </div>
</template>

<style scoped>
.avatar-row {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.avatar-actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.form__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-4);
}

.form__actions {
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 560px) {
  .form__grid {
    grid-template-columns: 1fr;
  }
}
</style>
