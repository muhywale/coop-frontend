import React, { useState, useEffect } from "react";
import {
  getProducts,
  createProduct,
  updateProduct,
  deactivateProduct,
  getChartOfAccounts,
} from "../api/api";
import { Table, TableHead, TableRow } from "../components/ui/Table";
import Card from "../components/ui/Card";
import Button from "../components/ui/Button";

const inputClass = "w-full border border-gray-300 rounded-md px-3 py-2";
const filterClass = "border border-gray-300 rounded-md px-3 py-2";

const emptyForm = () => ({
  name: "",
  category: "savings",
  interest_type: "",
  interest_rate: "",
  interest_product_id: "",
  interest_rules: [],
  first_payment_offset: "1",
  description: "",
  linked_account_id: "",
  is_compulsory: false,
  expected_amount: "",
  due_frequency: "monthly",
});

const toForm = (p) => ({
  name: p.name || "",
  category: p.category,
  interest_type: p.interest_type || "",
  interest_rate: p.interest_rate ?? "",
  interest_product_id: p.interest_product_id || "",
  interest_rules: (p.interest_rules || []).map((r) => ({
    months_after: String(r.months_after),
    rate: String(r.rate),
    basis: r.basis,
  })),
  first_payment_offset: String(p.first_payment_offset ?? 1),
  description: p.description || "",
  linked_account_id: p.linked_account_id || "",
  is_compulsory: !!p.is_compulsory,
  expected_amount: p.expected_amount ?? "",
  due_frequency: p.due_frequency || "monthly",
});

const validate = (f) => {
  if (f.category === "loan" && f.interest_type === "scheduled") {
    if (!f.interest_product_id)
      return "Choose the payment line that this loan's interest is paid through";
    const valid = f.interest_rules.filter(
      (r) => parseFloat(r.rate) > 0 && parseInt(r.months_after, 10) >= 0,
    );
    if (valid.length === 0)
      return "Add at least one interest charge with a rate";
  }
  return null;
};

// Empty strings become null so numeric columns never receive ""
const toPayload = (f) => {
  const isLoan = f.category === "loan";
  const usesRate =
    f.interest_type === "one_off" || f.interest_type === "reducing_balance";
  const paidSeparately =
    f.interest_type === "reducing_balance" || f.interest_type === "scheduled";
  return {
    name: f.name.trim(),
    category: f.category,
    description: f.description || null,
    linked_account_id: f.linked_account_id || null,
    interest_type: f.interest_type || null,
    interest_rate:
      usesRate && f.interest_rate !== "" && f.interest_rate != null
        ? parseFloat(f.interest_rate)
        : null,
    interest_product_id:
      isLoan && paidSeparately && f.interest_product_id
        ? Number(f.interest_product_id)
        : null,
    interest_rules:
      isLoan && f.interest_type === "scheduled"
        ? f.interest_rules
            .map((r) => ({
              months_after: parseInt(r.months_after, 10),
              rate: parseFloat(r.rate),
              basis: r.basis,
            }))
            .filter((r) => r.rate > 0 && r.months_after >= 0)
        : [],
    first_payment_offset: isLoan ? Number(f.first_payment_offset) : 1,
    is_compulsory: !isLoan && f.is_compulsory,
    expected_amount:
      !isLoan && f.is_compulsory && f.expected_amount !== ""
        ? parseFloat(f.expected_amount)
        : null,
    due_frequency: f.due_frequency || "monthly",
  };
};

const rulesSummary = (rules) =>
  (rules || [])
    .map(
      (r) =>
        `${parseFloat(r.rate)}% of ${r.basis === "balance" ? "balance" : "loan amount"} ${
          r.months_after === 0
            ? "with first payment"
            : `${r.months_after} months later`
        }`,
    )
    .join(" · ");

function ProductFields({
  form,
  setForm,
  accounts,
  interestProducts,
  categoryLocked,
}) {
  const set = (field) => (e) =>
    setForm({
      ...form,
      [field]: e.target.type === "checkbox" ? e.target.checked : e.target.value,
    });
  const isLoan = form.category === "loan";
  const usesRate =
    form.interest_type === "one_off" ||
    form.interest_type === "reducing_balance";
  const paidSeparately =
    form.interest_type === "reducing_balance" ||
    form.interest_type === "scheduled";

  const updateRule = (index, field, value) =>
    setForm({
      ...form,
      interest_rules: form.interest_rules.map((r, i) =>
        i === index ? { ...r, [field]: value } : r,
      ),
    });
  const addRule = () =>
    setForm({
      ...form,
      interest_rules: [
        ...form.interest_rules,
        { months_after: "0", rate: "", basis: "principal" },
      ],
    });
  const removeRule = (index) =>
    setForm({
      ...form,
      interest_rules: form.interest_rules.filter((_, i) => i !== index),
    });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <div>
        <label className="text-xs text-gray-500">Name</label>
        <input
          value={form.name}
          onChange={set("name")}
          required
          className={inputClass}
        />
      </div>
      <div>
        <label className="text-xs text-gray-500">
          Category{categoryLocked ? " (can't be changed once created)" : ""}
        </label>
        <select
          value={form.category}
          onChange={set("category")}
          disabled={categoryLocked}
          className={inputClass}
        >
          <option value="savings">Savings</option>
          <option value="loan">Loan</option>
          <option value="other">Other (fees, dues, fines)</option>
        </select>
      </div>
      <div>
        <label className="text-xs text-gray-500">Linked ledger account</label>
        <select
          value={form.linked_account_id}
          onChange={set("linked_account_id")}
          required
          className={inputClass}
        >
          <option value="">Select account...</option>
          {accounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.code} — {a.name}
            </option>
          ))}
        </select>
      </div>

      {isLoan && (
        <>
          <div>
            <label className="text-xs text-gray-500">
              First payment is due
            </label>
            <select
              value={form.first_payment_offset}
              onChange={set("first_payment_offset")}
              className={inputClass}
            >
              <option value="1">In the month after the booking date</option>
              <option value="0">In the booking month itself</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Interest type</label>
            <select
              value={form.interest_type}
              onChange={set("interest_type")}
              className={inputClass}
            >
              <option value="">None</option>
              <option value="one_off">
                One-off (added to the loan when issued)
              </option>
              <option value="reducing_balance">
                Reducing balance (monthly, paid separately)
              </option>
              <option value="scheduled">
                Scheduled charges (paid separately)
              </option>
            </select>
          </div>
          {usesRate && (
            <div>
              <label className="text-xs text-gray-500">
                Interest rate (% per year)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.interest_rate}
                onChange={set("interest_rate")}
                className={inputClass}
              />
            </div>
          )}
          {paidSeparately && (
            <div>
              <label className="text-xs text-gray-500">
                Interest is paid through
              </label>
              <select
                value={form.interest_product_id}
                onChange={set("interest_product_id")}
                className={inputClass}
              >
                <option value="">Select the interest payment line...</option>
                {interestProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {form.interest_type === "scheduled" && (
            <div className="sm:col-span-3">
              <label className="text-xs text-gray-500">
                Interest charges. Each is due once, as a separate payment on the
                line above.
              </label>
              {form.interest_rules.map((r, i) => (
                <div
                  key={i}
                  className="grid grid-cols-1 sm:grid-cols-4 gap-3 mt-2 items-end"
                >
                  <div>
                    <label className="text-xs text-gray-500">
                      Months after the first payment (0 = with it)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={r.months_after}
                      onChange={(e) =>
                        updateRule(i, "months_after", e.target.value)
                      }
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Rate (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={r.rate}
                      onChange={(e) => updateRule(i, "rate", e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Applied to</label>
                    <select
                      value={r.basis}
                      onChange={(e) => updateRule(i, "basis", e.target.value)}
                      className={inputClass}
                    >
                      <option value="principal">Original loan amount</option>
                      <option value="balance">Balance at that time</option>
                    </select>
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => removeRule(i)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="secondary"
                className="mt-3"
                onClick={addRule}
              >
                + Add interest charge
              </Button>
            </div>
          )}
        </>
      )}

      <div className="sm:col-span-3">
        <label className="text-xs text-gray-500">Description (optional)</label>
        <input
          value={form.description}
          onChange={set("description")}
          className={inputClass}
        />
      </div>

      {!isLoan && (
        <div className="sm:col-span-3 grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={form.is_compulsory}
              onChange={set("is_compulsory")}
            />
            Compulsory due (appears on the Payment Schedule)
          </label>
          {form.is_compulsory && (
            <>
              <div>
                <label className="text-xs text-gray-500">
                  Minimum / expected amount
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.expected_amount}
                  onChange={set("expected_amount")}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500">Due</label>
                <select
                  value={form.due_frequency}
                  onChange={set("due_frequency")}
                  className={inputClass}
                >
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm());
  const [filter, setFilter] = useState("all");
  const [message, setMessage] = useState(null);

  const fetchProducts = async () => {
    const res = await getProducts();
    setProducts(res.data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
    getChartOfAccounts().then((res) => setAccounts(res.data));
  }, []);

  const accountLabel = (id) => {
    const a = accounts.find((x) => x.id === id);
    return a ? `${a.code} — ${a.name}` : null;
  };
  const nameById = {};
  products.forEach((p) => {
    nameById[p.id] = p.name;
  });
  const interestProducts = products.filter((p) => p.category === "other");

  const handleCreate = async (e) => {
    e.preventDefault();
    setMessage(null);
    const problem = validate(form);
    if (problem) {
      setMessage({ text: problem, ok: false });
      return;
    }
    try {
      await createProduct(toPayload(form));
      setForm(emptyForm());
      setMessage({ text: "Product added.", ok: true });
      fetchProducts();
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || "Failed to add product",
        ok: false,
      });
    }
  };

  const startEdit = (p) => {
    setEditingId(p.id);
    setEditForm(toForm(p));
    setMessage(null);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    setMessage(null);
    const problem = validate(editForm);
    if (problem) {
      setMessage({ text: problem, ok: false });
      return;
    }
    try {
      await updateProduct(editingId, toPayload(editForm));
      setEditingId(null);
      setMessage({ text: "Product updated.", ok: true });
      fetchProducts();
    } catch (err) {
      setMessage({
        text: err.response?.data?.error || "Failed to update product",
        ok: false,
      });
    }
  };

  const handleDeactivate = async (p) => {
    if (
      !window.confirm(
        `Deactivate "${p.name}"? It will no longer appear for new entries.`,
      )
    )
      return;
    await deactivateProduct(p.id);
    fetchProducts();
  };

  if (loading) return <p className="text-gray-500">Loading products...</p>;

  const paidSeparately = (p) =>
    p.interest_type === "reducing_balance" || p.interest_type === "scheduled";
  const notCompulsoryCount = products.filter(
    (p) => p.category !== "loan" && !p.is_compulsory,
  ).length;
  const notLinkedCount = products.filter((p) => !p.linked_account_id).length;
  const noInterestLineCount = products.filter(
    (p) => p.category === "loan" && paidSeparately(p) && !p.interest_product_id,
  ).length;

  const visible = products.filter((p) => {
    if (filter === "not_compulsory")
      return p.category !== "loan" && !p.is_compulsory;
    if (filter === "not_linked") return !p.linked_account_id;
    if (filter === "no_interest_line")
      return (
        p.category === "loan" && paidSeparately(p) && !p.interest_product_id
      );
    return true;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Products</h2>

      <Card>
        <h3 className="font-semibold mb-4">Add Product</h3>
        <form onSubmit={handleCreate} className="space-y-4">
          <ProductFields
            form={form}
            setForm={setForm}
            accounts={accounts}
            interestProducts={interestProducts}
            categoryLocked={false}
          />
          <Button type="submit">Add Product</Button>
        </form>
      </Card>

      {message && (
        <p
          className={`text-sm rounded-md px-4 py-2 border ${message.ok ? "text-green-700 bg-green-50 border-green-200" : "text-red-700 bg-red-50 border-red-200"}`}
        >
          {message.text}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={filterClass}
        >
          <option value="all">All products ({products.length})</option>
          <option value="not_compulsory">
            Compulsory due not set ({notCompulsoryCount})
          </option>
          <option value="not_linked">
            Not linked to a ledger account ({notLinkedCount})
          </option>
          <option value="no_interest_line">
            Loans paying interest separately, with no interest line (
            {noInterestLineCount})
          </option>
        </select>
      </div>

      <Table>
        <TableHead>
          <th className="py-3 px-6">Name</th>
          <th className="py-3 px-6">Category</th>
          <th className="py-3 px-6">Ledger account</th>
          <th className="py-3 px-6">Interest</th>
          <th className="py-3 px-6">Compulsory due / first payment</th>
          <th className="py-3 px-6">Actions</th>
        </TableHead>
        <tbody>
          {visible.map((p) => (
            <React.Fragment key={p.id}>
              <TableRow>
                <td className="py-3 px-6 font-medium">{p.name}</td>
                <td className="py-3 px-6 capitalize text-gray-600">
                  {p.category}
                </td>
                <td className="py-3 px-6">
                  {p.linked_account_id ? (
                    <span className="text-gray-600">
                      {accountLabel(p.linked_account_id) || "Linked"}
                    </span>
                  ) : (
                    <span className="text-red-600 text-xs font-medium">
                      ⚠ Not linked
                    </span>
                  )}
                </td>
                <td className="py-3 px-6 text-gray-600">
                  {p.category === "loan" && p.interest_type ? (
                    <>
                      {p.interest_type === "scheduled"
                        ? rulesSummary(p.interest_rules) ||
                          "Scheduled (no charges set)"
                        : `${parseFloat(p.interest_rate || 0)}% ${p.interest_type === "reducing_balance" ? "reducing" : "one-off"}`}
                      {paidSeparately(p) && (
                        <span className="block text-xs text-gray-400">
                          {p.interest_product_id
                            ? `paid via ${nameById[p.interest_product_id] || "?"}`
                            : "⚠ no interest payment line"}
                        </span>
                      )}
                    </>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="py-3 px-6 text-gray-600">
                  {p.category === "loan" ? (
                    <span className="text-xs">
                      First payment{" "}
                      {p.first_payment_offset === 0
                        ? "in the booking month"
                        : "the month after booking"}
                    </span>
                  ) : p.is_compulsory ? (
                    `₦${parseFloat(p.expected_amount || 0).toLocaleString()} ${p.due_frequency}`
                  ) : (
                    <span className="text-gray-400">Not set</span>
                  )}
                </td>
                <td className="py-3 px-6">
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() =>
                        editingId === p.id ? setEditingId(null) : startEdit(p)
                      }
                    >
                      {editingId === p.id ? "Cancel" : "Edit"}
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => handleDeactivate(p)}
                    >
                      Deactivate
                    </Button>
                  </div>
                </td>
              </TableRow>
              {editingId === p.id && (
                <tr>
                  <td colSpan="6" className="bg-gray-50 px-6 py-4">
                    <form onSubmit={handleSaveEdit} className="space-y-4">
                      <ProductFields
                        form={editForm}
                        setForm={setEditForm}
                        accounts={accounts}
                        interestProducts={interestProducts}
                        categoryLocked
                      />
                      <div className="flex gap-2">
                        <Button type="submit">Save changes</Button>
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export default ProductsPage;
