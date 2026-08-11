import React, { useState, useEffect } from "react";
import { getProducts, createProduct, deactivateProduct } from "../api/api";
import { Table, TableHead, TableRow } from "../components/ui/Table";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const inputClass =
  "w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary-500";

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [formData, setFormData] = useState({
    name: "",
    category: "savings",
    interest_type: "",
    interest_rate: "",
    description: "",
  });
  const [message, setMessage] = useState("");

  const fetchProducts = async () => {
    const res = await getProducts();
    setProducts(res.data);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (e) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createProduct(formData);
      setMessage(`"${formData.name}" added successfully.`);
      setFormData({
        name: "",
        category: "savings",
        interest_type: "",
        interest_rate: "",
        description: "",
      });
      fetchProducts();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to add product");
    }
  };

  const handleDeactivate = async (id) => {
    if (
      !window.confirm(
        "Deactivate this product? It will no longer appear in entry forms.",
      )
    )
      return;
    await deactivateProduct(id);
    fetchProducts();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Products</h2>

      <Card>
        <h3 className="text-lg font-semibold mb-4">Add New Product</h3>
        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 sm:grid-cols-3 gap-4"
        >
          <input
            name="name"
            placeholder="Product name (e.g. Annual Due)"
            value={formData.name}
            onChange={handleChange}
            required
            className={inputClass}
          />
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className={inputClass}
          >
            <option value="savings">Savings</option>
            <option value="loan">Loan</option>
            <option value="other">Other (fee, due, fine, etc.)</option>
          </select>
          {formData.category === "loan" && (
            <select
              name="interest_type"
              value={formData.interest_type}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">Select interest type</option>
              <option value="one_off">One-off</option>
              <option value="reducing_balance">Reducing balance</option>
            </select>
          )}
          {formData.category === "loan" && (
            <input
              name="interest_rate"
              type="number"
              step="0.01"
              placeholder="Interest rate (%)"
              value={formData.interest_rate}
              onChange={handleChange}
              className={inputClass}
            />
          )}
          <input
            name="description"
            placeholder="Description (optional)"
            value={formData.description}
            onChange={handleChange}
            className={inputClass}
          />
          <Button type="submit" className="sm:col-span-3 w-fit">
            Add Product
          </Button>
        </form>
        {message && <p className="text-sm text-primary-700 mt-3">{message}</p>}
      </Card>

      <Table>
        <TableHead>
          <th className="py-3 px-6">Name</th>
          <th className="py-3 px-6">Category</th>
          <th className="py-3 px-6">Interest</th>
          <th className="py-3 px-6">Description</th>
          <th className="py-3 px-6">Actions</th>
        </TableHead>
        <tbody>
          {products.map((p) => (
            <TableRow key={p.id}>
              <td className="py-3 px-6 font-medium">{p.name}</td>
              <td className="py-3 px-6 capitalize text-gray-600">
                {p.category}
              </td>
              <td className="py-3 px-6 text-gray-600">
                {p.interest_rate
                  ? `${p.interest_rate}% (${p.interest_type === "reducing_balance" ? "reducing" : "one-off"})`
                  : "—"}
              </td>
              <td className="py-3 px-6 text-gray-500">{p.description}</td>
              <td className="py-3 px-6">
                <Button variant="danger" onClick={() => handleDeactivate(p.id)}>
                  Deactivate
                </Button>
              </td>
            </TableRow>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default ProductsPage;
