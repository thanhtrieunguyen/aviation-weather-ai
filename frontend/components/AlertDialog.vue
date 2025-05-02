<template>
    <div class="dialog" v-if="modelValue">
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label>Area</label>
          <input v-model="formData.area" required>
        </div>
        <div class="form-group">
          <label>Content</label>
          <textarea v-model="formData.content" required></textarea>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select v-model="formData.status">
            <option value="active">Active</option>
            <option value="expired">Expired</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <button type="submit">Save</button>
      </form>
    </div>
  </template>
  
  <script>
  export default {
    props: {
      modelValue: Boolean,
      alert: Object
    },
    data() {
      return {
        formData: {
          area: '',
          content: '',
          time: new Date(),
          status: 'active'
        }
      };
    },
    watch: {
      alert: {
        handler(newVal) {
          if (newVal) {
            this.formData = { ...newVal };
          } else {
            this.resetForm();
          }
        },
        immediate: true
      }
    },
    methods: {
      resetForm() {
        this.formData = {
          area: '',
          content: '',
          time: new Date(),
          status: 'active'
        };
      },
      handleSubmit() {
        this.$emit('save', this.formData);
      }
    }
  };
  </script>