import { useState, useEffect, useRef } from "react";
import {
  Search,
  Trash2,
  Plus,
  Minus,
  ShoppingCart,
  X,
  Printer,
  Check,
  User,
  UserPlus,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../lib/api.js";
import { usePOSStore } from "../store/index.js";
import { useSettingsStore } from "../store/index.js";
import { Modal } from "../components/ui/index.jsx";

const PaymentMethods = ["cash", "card", "mobile_banking"];

export default function POSPage() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [processing, setProcessing] = useState(false);
  const searchRef = useRef(null);

  // Customer search states
  const [customerSearch, setCustomerSearch] = useState("");
  const [customerResults, setCustomerResults] = useState([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const customerInputRef = useRef(null);
  const dropdownRef = useRef(null);

  const { settings } = useSettingsStore();
  const sym = settings?.currencySymbol || "$";

  const {
    cart,
    customer,
    discount,
    paymentMethod,
    amountPaid,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateItemDiscount,
    setCustomer,
    setDiscount,
    setPaymentMethod,
    setAmountPaid,
    clearCart,
    getSubtotal,
    getTax,
    getTotal,
  } = usePOSStore();

  // Search products (debounced)
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!search.trim()) {
        setProducts([]);
        return;
      }
      setLoading(true);
      try {
        const { data } = await api.get(`/products?search=${search}&limit=12`);
        setProducts(data.data);
      } catch {
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  // Barcode scan (Enter key in search)
  const handleSearchKey = async (e) => {
    if (e.key === "Enter" && search.trim()) {
      try {
        const { data } = await api.get(`/products/barcode/${search.trim()}`);
        addToCart(data.data);
        setSearch("");
        toast.success(`Added: ${data.data.name}`);
      } catch {
        toast.error("Product not found by barcode");
      }
    }
  };

  // Search customers (debounced)
  useEffect(() => {
    const t = setTimeout(async () => {
      if (!customerSearch.trim()) {
        setCustomerResults([]);
        return;
      }
      setIsSearchingCustomers(true);
      try {
        const { data } = await api.get(
          `/customers?search=${customerSearch}&limit=10`
        );
        setCustomerResults(data.data);
      } catch {
        setCustomerResults([]);
      } finally {
        setIsSearchingCustomers(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [customerSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        customerInputRef.current &&
        !customerInputRef.current.contains(e.target)
      ) {
        setShowCustomerDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectCustomer = (cust) => {
    setCustomer(cust);
    setCustomerSearch(""); // Clear search
    setShowCustomerDropdown(false);
  };

  const handleWalkIn = () => {
    setCustomer(null);
    setCustomerSearch("");
    setShowCustomerDropdown(false);
  };

  const openAddCustomerModal = () => {
    // Pre-fill phone if search looks like a number
    const phoneCandidate = customerSearch.trim();
    setNewCustomerForm({
      name: "",
      phone: /^[\d\s\-\+\(\)]+$/.test(phoneCandidate) ? phoneCandidate : "",
      email: "",
      address: "",
    });
    setShowAddCustomerModal(true);
    setShowCustomerDropdown(false);
  };

  const handleSaveNewCustomer = async () => {
    if (!newCustomerForm.name.trim()) {
      toast.error("Customer name is required");
      return;
    }
    try {
      const { data } = await api.post("/customers", newCustomerForm);
      toast.success("Customer added");
      setCustomer(data.data);
      setShowAddCustomerModal(false);
      setCustomerSearch("");
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add customer");
    }
  };

  const subtotal = getSubtotal();
  const tax = getTax();
  const total = getTotal();
  const change = Math.max(0, amountPaid - total);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    if (amountPaid < total) {
      toast.error("Insufficient payment amount");
      return;
    }
    setProcessing(true);
    try {
      const { data } = await api.post("/sales", {
        items: cart.map((i) => ({
          productId: i._id,
          quantity: i.quantity,
          discount: i.itemDiscount || 0,
        })),
        customerId: customer?._id,
        discount,
        paymentMethod,
        amountPaid,
      });
      toast.success(`Sale complete! Invoice: ${data.data.invoiceNo}`);
      clearCart();
      setShowCheckout(false);
      window.open(`/api/sales/${data.data._id}/print`, "_blank");
    } catch (err) {
      toast.error(err.response?.data?.message || "Sale failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-4 md:h-[calc(100vh-7rem)]">
      {/* Left: Product search */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="card p-4 mb-4">
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              ref={searchRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={handleSearchKey}
              placeholder="Search product or scan barcode (Enter)..."
              className="input pl-10"
              autoFocus
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {products.map((p) => (
                <button
                  key={p._id}
                  onClick={() => {
                    addToCart(p);
                    toast.success(`Added: ${p.name}`);
                  }}
                  disabled={p.stock <= 0}
                  className="card p-4 text-left hover:shadow-md hover:border-brand-200 dark:hover:border-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-full aspect-square rounded-lg bg-slate-100 dark:bg-slate-700 mb-3 overflow-hidden">
                    {p.image ? (
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingCart size={24} className="text-slate-300" />
                      </div>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                    {p.name}
                  </p>
                  <p className="text-xs text-slate-500 mb-2">
                    Stock: {p.stock}
                  </p>
                  <p className="text-base font-bold text-brand-600">
                    {sym}
                    {p.sellingPrice.toFixed(2)}
                  </p>
                </button>
              ))}
              {!loading && products.length === 0 && search && (
                <div className="col-span-full text-center py-12 text-slate-400">
                  <Search size={40} className="mx-auto mb-2 opacity-30" />
                  <p>No products found</p>
                </div>
              )}
              {!search && (
                <div className="col-span-full text-center py-12 text-slate-400">
                  <ShoppingCart size={40} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Search for a product to add to cart</p>
                  <p className="text-xs mt-1">Or scan a barcode</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div className="w-full lg:w-96 flex flex-col card overflow-hidden">
        {/* Cart header */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart size={18} className="text-brand-600" />
            <span className="font-semibold text-slate-900 dark:text-white">
              Cart
            </span>
            {cart.length > 0 && (
              <span className="badge-blue">
                {cart.reduce((s, i) => s + i.quantity, 0)} items
              </span>
            )}
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs text-red-500 hover:text-red-700 font-medium"
            >
              Clear
            </button>
          )}
        </div>

        {/* Customer search with dropdown */}
        <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
          <div className="relative">
            <div className="flex items-center gap-2">
              <User size={14} className="text-slate-400 shrink-0" />
              <input
                ref={customerInputRef}
                type="text"
                placeholder="Search customer by phone or name..."
                value={
                  customer
                    ? `${customer.name} ${customer.phone ? `· ${customer.phone}` : ""}`
                    : customerSearch
                }
                onChange={(e) => {
                  // If a customer is selected and user starts typing, clear selection
                  if (customer) setCustomer(null);
                  setCustomerSearch(e.target.value);
                  setShowCustomerDropdown(true);
                }}
                onFocus={() => setShowCustomerDropdown(true)}
                className="flex-1 text-sm bg-transparent border-0 outline-none text-slate-700 dark:text-slate-300 placeholder:text-slate-400"
              />
              {customer && (
                <button
                  onClick={handleWalkIn}
                  className="text-xs text-brand-600 hover:text-brand-700"
                >
                  Change
                </button>
              )}
            </div>

            {/* Dropdown */}
            {showCustomerDropdown && (
              <div
                ref={dropdownRef}
                className="absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 max-h-64 overflow-y-auto"
              >
                {/* Walk-in option */}
                <button
                  onClick={handleWalkIn}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"
                >
                  <User size={14} className="text-slate-400" />
                  <span>Walk-in Customer</span>
                  {!customer && <Check size={14} className="ml-auto text-brand-600" />}
                </button>

                {isSearchingCustomers ? (
                  <div className="px-4 py-3 text-center text-sm text-slate-500">
                    <div className="w-4 h-4 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto mb-1" />
                    Searching...
                  </div>
                ) : customerResults.length > 0 ? (
                  <>
                    <div className="px-3 py-1 text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Customers
                    </div>
                    {customerResults.map((cust) => (
                      <button
                        key={cust._id}
                        onClick={() => handleSelectCustomer(cust)}
                        className="w-full px-4 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-between"
                      >
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">
                            {cust.name}
                          </div>
                          {cust.phone && (
                            <div className="text-xs text-slate-500">
                              {cust.phone}
                            </div>
                          )}
                        </div>
                        {customer?._id === cust._id && (
                          <Check size={14} className="text-brand-600" />
                        )}
                      </button>
                    ))}
                  </>
                ) : customerSearch.trim() !== "" ? (
                  <div className="px-4 py-4 text-center">
                    <p className="text-sm text-slate-500 mb-3">
                      No customer found
                    </p>
                    <button
                      onClick={openAddCustomerModal}
                      className="btn-secondary w-full text-sm py-2 flex items-center justify-center gap-2"
                    >
                      <UserPlus size={16} />
                      Add "{customerSearch}" as new customer
                    </button>
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <ShoppingCart size={36} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Cart is empty</p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item._id}
                className="bg-slate-50 dark:bg-slate-700/50 rounded-xl p-3"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-sm font-medium text-slate-900 dark:text-white leading-tight">
                    {item.name}
                  </p>
                  <button
                    onClick={() => removeFromCart(item._id)}
                    className="text-slate-400 hover:text-red-500 shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() =>
                        updateQuantity(item._id, item.quantity - 1)
                      }
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 flex items-center justify-center hover:bg-slate-100 text-slate-600 dark:text-slate-300"
                    >
                      <Minus size={12} />
                    </button>
                    <span className="text-sm font-bold w-6 text-center text-slate-900 dark:text-white">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() =>
                        updateQuantity(item._id, item.quantity + 1)
                      }
                      className="w-7 h-7 rounded-lg bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-500 flex items-center justify-center hover:bg-slate-100 text-slate-600 dark:text-slate-300"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <p className="text-sm font-bold text-brand-600">
                    {sym}
                    {(
                      item.sellingPrice * item.quantity -
                      (item.itemDiscount || 0)
                    ).toFixed(2)}
                  </p>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  {sym}
                  {item.sellingPrice.toFixed(2)} each
                </p>
              </div>
            ))
          )}
        </div>

        {/* Order summary */}
        <div className="border-t border-slate-100 dark:border-slate-700 p-4 space-y-2">
          <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
            <span>Subtotal</span>
            <span>
              {sym}
              {subtotal.toFixed(2)}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-400">
            <span>Discount</span>
            <div className="flex items-center gap-1">
              <span>{sym}</span>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(Number(e.target.value))}
                className="w-20 text-right text-sm border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-0.5 bg-white dark:bg-slate-700"
              />
            </div>
          </div>
          {tax > 0 && (
            <div className="flex justify-between text-sm text-slate-600 dark:text-slate-400">
              <span>Tax</span>
              <span>
                {sym}
                {tax.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold text-slate-900 dark:text-white pt-2 border-t border-slate-100 dark:border-slate-700">
            <span>Total</span>
            <span className="text-brand-600">
              {sym}
              {total.toFixed(2)}
            </span>
          </div>

          {/* Payment method */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {PaymentMethods.map((m) => (
              <button
                key={m}
                onClick={() => setPaymentMethod(m)}
                className={`py-1.5 rounded-xl text-xs font-medium capitalize transition-all
                  ${
                    paymentMethod === m
                      ? "bg-brand-600 text-white"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"
                  }`}
              >
                {m.replace("_", " ")}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowCheckout(true)}
            disabled={cart.length === 0}
            className="btn-primary w-full py-3 text-base mt-2 disabled:opacity-50"
          >
            <ShoppingCart size={18} /> Checkout {sym}
            {total.toFixed(2)}
          </button>
        </div>
      </div>

      {/* Checkout Modal */}
      <Modal
        open={showCheckout}
        onClose={() => setShowCheckout(false)}
        title="Complete Sale"
        size="sm"
      >
        <div className="space-y-4">
          <div className="bg-slate-50 dark:bg-slate-700 rounded-xl p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span>Subtotal</span>
              <span>
                {sym}
                {subtotal.toFixed(2)}
              </span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between text-sm text-red-500">
                <span>Discount</span>
                <span>
                  -{sym}
                  {discount.toFixed(2)}
                </span>
              </div>
            )}
            {tax > 0 && (
              <div className="flex justify-between text-sm">
                <span>Tax</span>
                <span>
                  {sym}
                  {tax.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base border-t border-slate-200 dark:border-slate-600 pt-2">
              <span>Total</span>
              <span className="text-brand-600">
                {sym}
                {total.toFixed(2)}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Amount Received
            </label>
            <input
              type="number"
              min={total}
              value={amountPaid || ""}
              onChange={(e) => setAmountPaid(Number(e.target.value))}
              className="input text-lg font-bold"
              placeholder={total.toFixed(2)}
            />
          </div>

          {amountPaid >= total && (
            <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-3 text-center">
              <p className="text-sm text-emerald-700 dark:text-emerald-300">
                Change:{" "}
                <span className="font-bold text-lg">
                  {sym}
                  {change.toFixed(2)}
                </span>
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowCheckout(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleCheckout}
              disabled={processing || amountPaid < total}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              {processing ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Check size={16} /> Confirm Sale
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Add Customer Modal */}
      <Modal
        open={showAddCustomerModal}
        onClose={() => setShowAddCustomerModal(false)}
        title="Add New Customer"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Name *
            </label>
            <input
              type="text"
              value={newCustomerForm.name}
              onChange={(e) =>
                setNewCustomerForm((f) => ({ ...f, name: e.target.value }))
              }
              className="input"
              placeholder="John Doe"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Phone
            </label>
            <input
              type="text"
              value={newCustomerForm.phone}
              onChange={(e) =>
                setNewCustomerForm((f) => ({ ...f, phone: e.target.value }))
              }
              className="input"
              placeholder="+1 234 567 8900"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={newCustomerForm.email}
              onChange={(e) =>
                setNewCustomerForm((f) => ({ ...f, email: e.target.value }))
              }
              className="input"
              placeholder="john@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Address
            </label>
            <textarea
              value={newCustomerForm.address}
              onChange={(e) =>
                setNewCustomerForm((f) => ({ ...f, address: e.target.value }))
              }
              rows={2}
              className="input resize-none"
              placeholder="Street address..."
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setShowAddCustomerModal(false)}
              className="btn-secondary flex-1"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveNewCustomer}
              className="btn-primary flex-1"
            >
              Save Customer
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}