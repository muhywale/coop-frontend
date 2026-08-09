import React, { useState } from "react";
import { createMember } from "../../api/api";
import Card from "../ui/Card";
import Button from "../ui/Button";

const inputClass =
  "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent";

function MemberForm({ onMemberAdded }) {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
  });

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const response = await createMember(formData);
    onMemberAdded(response.data);
    setFormData({ full_name: "", email: "", phone: "" });
  };

  return (
    <Card className="mb-6">
      <h3 className="text-lg font-semibold mb-4">Add Member</h3>
      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 sm:grid-cols-3 gap-4"
      >
        <input
          name="full_name"
          placeholder="Full Name"
          value={formData.full_name}
          onChange={handleChange}
          required
          className={inputClass}
        />
        <input
          name="email"
          type="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className={inputClass}
        />
        <input
          name="phone"
          placeholder="Phone"
          value={formData.phone}
          onChange={handleChange}
          className={inputClass}
        />
        <Button type="submit" className="sm:col-span-3 w-fit">
          Add Member
        </Button>
      </form>
    </Card>
  );
}

export default MemberForm;
