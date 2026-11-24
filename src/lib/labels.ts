import type { Role } from './types.ts'

export function roleLabel(role: Role): string {
  switch (role) {
    case 'owner':
      return 'Власник'
    case 'partner':
      return 'Партнер'
    case 'public':
      return 'Гість'
    case 'none':
      return 'Немає доступу'
  }
}

export function visibilityLabel(value: string): string {
  switch (value) {
    case 'public':
      return 'Публічний'
    case 'partner':
      return 'Партнери'
    case 'owner':
      return 'Лише власник'
    default:
      return value
  }
}

export function accessLabel(level: string | null | undefined): string {
  switch ((level ?? '').toUpperCase()) {
    case 'PUBLIC':
      return 'Публічний'
    case 'PARTNER':
      return 'Партнер'
    case 'PRIVATE':
      return 'Приватний'
    default:
      return level?.trim() ? level : '—'
  }
}

export function changeTypeLabel(value: string | null | undefined): string {
  switch ((value ?? '').toUpperCase()) {
    case 'INSERT':
      return 'Додано'
    case 'UPDATE':
      return 'Оновлено'
    case 'DELETE':
      return 'Видалено'
    default:
      return value?.trim() ? value : '—'
  }
}

export function reportTypeLabel(value: string | null | undefined): string {
  switch ((value ?? '').toLowerCase()) {
    case 'daily':
      return 'Щоденний'
    case 'weekly':
      return 'Тижневий'
    case 'monthly':
      return 'Місячний'
    default:
      return value?.trim() ? value : 'Звіт'
  }
}

export function syncStatusLabel(value: string | null | undefined): string {
  switch ((value ?? '').toLowerCase()) {
    case 'ok':
      return 'Успішно'
    case 'error':
      return 'Помилка'
    case 'running':
      return 'Виконується'
    case 'never':
      return 'Ще не було'
    default:
      return value?.trim() ? value : '—'
  }
}
