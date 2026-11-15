import { useCallback, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { adminCatalogApi } from '../../api/adminCommerceApi';
import type {
  AdminCategory,
  AdminProduct,
  AdminVariant,
  CategoryPayload,
  ProductCreatePayload,
  ProductImagePayload,
  ProductPayload,
  ProductVariantPayload,
} from '../../api/adminTypes';
import { useApiResource } from '../../hooks/useApiResource';
import {
  errorMessage,
  formatMoney,
  normalizePage,
  prettyStatus,
} from '../../lib/commerce';
import { Pagination } from '../Pagination';
import { SelectField } from '../SelectField';
import {
  Alert,
  Button,
  Card,
  EmptyState,
  ErrorState,
  PageTitle,
  TextField,
} from '../ui';
import { AdminFrame } from './AdminCommon';
import { useAppTheme } from '../../ThemeProvider';

const PRODUCT_TYPES = ['CLOTHING', 'ACCESSORY', 'SKINCARE'] as const;
type ProductType = (typeof PRODUCT_TYPES)[number];

function isProductType(value: string): value is ProductType {
  return (
    value === 'CLOTHING' ||
    value === 'ACCESSORY' ||
    value === 'SKINCARE'
  );
}

type CategoryForm = {
  name: string;
  parentCategoryId: string;
};

type ProductForm = {
  type: ProductType;
  categoryId: string;
  name: string;
  basePrice: string;
  description: string;
  details: string;
  clothingType: string;
  accessoryType: string;
  skincareType: string;
  material: string;
  skinType: string;
  size: string;
  color: string;
  volumeMl: string;
  sizeLabel: string;
  formulation: string;
  priceAdjustment: string;
  additionalDescription: string;
};

type VariantForm = {
  variantItemId: number | null;
  size: string;
  color: string;
  material: string;
  volumeMl: string;
  sizeLabel: string;
  formulation: string;
  priceAdjustment: string;
  additionalDescription: string;
  makeDefault: boolean;
};

type ImageForm = {
  imageUrl: string;
  altText: string;
  displayOrder: string;
  main: boolean;
};

const EMPTY_CATEGORY: CategoryForm = { name: '', parentCategoryId: '' };
const EMPTY_PRODUCT: ProductForm = {
  type: 'CLOTHING',
  categoryId: '',
  name: '',
  basePrice: '',
  description: '',
  details: '',
  clothingType: '',
  accessoryType: '',
  skincareType: '',
  material: '',
  skinType: '',
  size: '',
  color: '',
  volumeMl: '',
  sizeLabel: '',
  formulation: '',
  priceAdjustment: '0',
  additionalDescription: '',
};
const EMPTY_VARIANT: VariantForm = {
  variantItemId: null,
  size: '',
  color: '',
  material: '',
  volumeMl: '',
  sizeLabel: '',
  formulation: '',
  priceAdjustment: '0',
  additionalDescription: '',
  makeDefault: false,
};
const EMPTY_IMAGE: ImageForm = {
  imageUrl: '',
  altText: '',
  displayOrder: '0',
  main: false,
};

function variantLabel(variant: AdminVariant) {
  return [
    variant.size,
    variant.color,
    variant.material,
    variant.sizeLabel,
    variant.volumeMl ? `${variant.volumeMl} ml` : null,
    variant.formulation,
    variant.additionalDescription,
  ]
    .filter(Boolean)
    .join(' · ') || 'Standard';
}

function variantPayload(
  form: VariantForm,
  makeDefault = form.makeDefault,
): ProductVariantPayload {
  return {
    size: form.size.trim() || null,
    color: form.color.trim() || null,
    material: form.material.trim() || null,
    volumeMl: form.volumeMl ? Number(form.volumeMl) : null,
    sizeLabel: form.sizeLabel.trim() || null,
    formulation: form.formulation.trim() || null,
    priceAdjustment: Number(form.priceAdjustment || 0),
    additionalDescription: form.additionalDescription.trim() || null,
    makeDefault,
  };
}

function productPayload(form: ProductForm): ProductPayload {
  return {
    type: form.type,
    categoryId: form.categoryId ? Number(form.categoryId) : null,
    name: form.name.trim(),
    basePrice: Number(form.basePrice),
    description: form.description.trim() || null,
    details: form.details.trim() || null,
    clothingType:
      form.type === 'CLOTHING' ? form.clothingType.trim() || null : null,
    accessoryType:
      form.type === 'ACCESSORY' ? form.accessoryType.trim() || null : null,
    skincareType:
      form.type === 'SKINCARE' ? form.skincareType.trim() || null : null,
    material: form.material.trim() || null,
    skinType:
      form.type === 'SKINCARE' ? form.skinType.trim() || null : null,
  };
}

function firstVariantPayload(form: ProductForm): ProductVariantPayload {
  return {
    size:
      form.type === 'CLOTHING' ? form.size.trim() || null : null,
    color:
      form.type !== 'SKINCARE' ? form.color.trim() || null : null,
    material:
      form.type === 'ACCESSORY' ? form.material.trim() || null : null,
    volumeMl:
      form.type === 'SKINCARE' && form.volumeMl
        ? Number(form.volumeMl)
        : null,
    sizeLabel:
      form.type === 'SKINCARE' ? form.sizeLabel.trim() || null : null,
    formulation:
      form.type === 'SKINCARE' ? form.formulation.trim() || null : null,
    priceAdjustment: Number(form.priceAdjustment || 0),
    additionalDescription: form.additionalDescription.trim() || null,
    makeDefault: true,
  };
}

function productFormFrom(product: AdminProduct): ProductForm {
  const details = product.typeDetails ?? {};
  const variant =
    product.variants?.find((item) => item.defaultVariant) ??
    product.variants?.[0];
  return {
    ...EMPTY_PRODUCT,
    type: isProductType(product.type) ? product.type : 'CLOTHING',
    categoryId: product.categoryId == null ? '' : String(product.categoryId),
    name: product.name,
    basePrice: String(product.basePrice ?? ''),
    description: product.description ?? '',
    details: product.details ?? '',
    clothingType: String(details.clothingType ?? ''),
    accessoryType: String(details.accessoryType ?? ''),
    skincareType: String(details.skincareType ?? ''),
    material: String(details.material ?? variant?.material ?? ''),
    skinType: String(details.skinType ?? ''),
    size: variant?.size ?? '',
    color: variant?.color ?? '',
    volumeMl: variant?.volumeMl == null ? '' : String(variant.volumeMl),
    sizeLabel: variant?.sizeLabel ?? '',
    formulation: variant?.formulation ?? '',
    priceAdjustment: String(variant?.priceAdjustment ?? 0),
    additionalDescription: variant?.additionalDescription ?? '',
  };
}

function variantFormFrom(variant: AdminVariant): VariantForm {
  return {
    variantItemId: variant.variantItemId,
    size: variant.size ?? '',
    color: variant.color ?? '',
    material: variant.material ?? '',
    volumeMl: variant.volumeMl == null ? '' : String(variant.volumeMl),
    sizeLabel: variant.sizeLabel ?? '',
    formulation: variant.formulation ?? '',
    priceAdjustment: String(variant.priceAdjustment ?? 0),
    additionalDescription: variant.additionalDescription ?? '',
    makeDefault: variant.defaultVariant,
  };
}

export function AdminCatalog() {
  const { theme } = useAppTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const loadCategories = useCallback(() => adminCatalogApi.categories(), []);
  const [page, setPage] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [activeFilter, setActiveFilter] = useState('');
  const loadProducts = useCallback(
    () =>
      adminCatalogApi.products({
        categoryId: categoryFilter,
        type: typeFilter,
        active: activeFilter,
        page,
        size: 12,
      }),
    [categoryFilter, typeFilter, activeFilter, page],
  );
  const categoriesState = useApiResource(loadCategories);
  const productsState = useApiResource(loadProducts);
  const categories = useMemo(
    () => categoriesState.data ?? [],
    [categoriesState.data],
  );
  const products = normalizePage(productsState.data);

  const [categoryForm, setCategoryForm] =
    useState<CategoryForm>(EMPTY_CATEGORY);
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(
    null,
  );
  const [productForm, setProductForm] =
    useState<ProductForm>(EMPTY_PRODUCT);
  const [editingProductId, setEditingProductId] = useState<number | null>(
    null,
  );
  const [selectedProductId, setSelectedProductId] = useState<number | null>(
    null,
  );
  const [variantForm, setVariantForm] = useState<VariantForm | null>(null);
  const [imageVariantId, setImageVariantId] = useState<number | null>(null);
  const [imageForm, setImageForm] = useState<ImageForm>(EMPTY_IMAGE);
  const [editingImageId, setEditingImageId] = useState<number | null>(null);
  const [confirmImageId, setConfirmImageId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const loadSelectedProduct = useCallback(
    () =>
      selectedProductId === null
        ? Promise.resolve(null)
        : adminCatalogApi.product(selectedProductId),
    [selectedProductId],
  );
  const selectedProductState = useApiResource(loadSelectedProduct);
  const selectedProduct = selectedProductState.data;
  const selectedVariant = selectedProduct?.variants?.find(
    (variant) => variant.variantItemId === imageVariantId,
  );
  const loadImages = useCallback(
    () =>
      selectedProductId === null || imageVariantId === null
        ? Promise.resolve([])
        : adminCatalogApi.images(selectedProductId, imageVariantId),
    [selectedProductId, imageVariantId],
  );
  const imagesState = useApiResource(loadImages);

  const parentOptions = useMemo(
    () => [
      { value: '', label: 'No parent' },
      ...categories
        .filter((category) => category.id !== editingCategoryId)
        .map((category) => ({
          value: String(category.id),
          label: category.name,
        })),
    ],
    [categories, editingCategoryId],
  );
  const categoryOptions = useMemo(
    () => [
      { value: '', label: 'Uncategorized' },
      ...categories
        .filter((category) => category.active)
        .map((category) => ({
          value: String(category.id),
          label: category.name,
        })),
    ],
    [categories],
  );

  function reportError(requestError: unknown) {
    setNotice('');
    setError(errorMessage(requestError));
  }

  function reportSuccess(message: string) {
    setError('');
    setNotice(message);
  }

  async function saveCategory() {
    setError('');
    setNotice('');
    if (!categoryForm.name.trim()) {
      setError('Category name is required.');
      return;
    }
    if (
      categoryForm.parentCategoryId &&
      Number(categoryForm.parentCategoryId) === editingCategoryId
    ) {
      setError('A category cannot be its own parent.');
      return;
    }
    setBusy(true);
    try {
      const payload: CategoryPayload = {
        name: categoryForm.name.trim(),
        parentCategoryId: categoryForm.parentCategoryId
          ? Number(categoryForm.parentCategoryId)
          : null,
      };
      if (editingCategoryId !== null) {
        await adminCatalogApi.updateCategory(editingCategoryId, payload);
      } else {
        await adminCatalogApi.createCategory(payload);
      }
      setCategoryForm(EMPTY_CATEGORY);
      setEditingCategoryId(null);
      categoriesState.reload();
      reportSuccess(
        editingCategoryId !== null ? 'Category updated.' : 'Category created.',
      );
    } catch (requestError) {
      reportError(requestError);
    } finally {
      setBusy(false);
    }
  }

  async function toggleCategory(category: AdminCategory) {
    setBusyId(`category-${category.id}`);
    setError('');
    try {
      await adminCatalogApi.setCategoryActive(category.id, !category.active);
      categoriesState.reload();
      reportSuccess(
        `Category ${category.active ? 'deactivated' : 'activated'}.`,
      );
    } catch (requestError) {
      reportError(requestError);
    } finally {
      setBusyId(null);
    }
  }

  function editCategory(category: AdminCategory) {
    setEditingCategoryId(category.id);
    setCategoryForm({
      name: category.name,
      parentCategoryId:
        category.parentCategoryId == null
          ? ''
          : String(category.parentCategoryId),
    });
    setError('');
    setNotice('');
  }

  function editProduct(product: AdminProduct) {
    setEditingProductId(product.id);
    setProductForm(productFormFrom(product));
    setSelectedProductId(product.id);
    setVariantForm(null);
    setImageVariantId(null);
    setError('');
    setNotice('');
  }

  function resetProduct() {
    setEditingProductId(null);
    setProductForm(EMPTY_PRODUCT);
  }

  async function saveProduct() {
    setError('');
    setNotice('');
    const basePrice = Number(productForm.basePrice);
    if (!productForm.name.trim()) {
      setError('Product name is required.');
      return;
    }
    if (!Number.isFinite(basePrice) || basePrice < 0) {
      setError('Enter a valid non-negative base price.');
      return;
    }
    if (
      !productForm.priceAdjustment ||
      !Number.isFinite(Number(productForm.priceAdjustment))
    ) {
      setError('Enter a valid first-variant price adjustment.');
      return;
    }
    if (
      (productForm.type === 'CLOTHING' && !productForm.size.trim()) ||
      (productForm.type === 'CLOTHING' && !productForm.color.trim()) ||
      (productForm.type === 'CLOTHING' && !productForm.clothingType.trim())
    ) {
      setError('Clothing requires a type, size, and color.');
      return;
    }
    if (
      productForm.type === 'ACCESSORY' &&
      !productForm.accessoryType.trim()
    ) {
      setError('Accessory type is required.');
      return;
    }
    if (
      productForm.type === 'SKINCARE' &&
      !productForm.skincareType.trim()
    ) {
      setError('Skincare type is required.');
      return;
    }
    setBusy(true);
    try {
      const payload = productPayload(productForm);
      if (editingProductId !== null) {
        await adminCatalogApi.updateProduct(editingProductId, payload);
        reportSuccess('Product updated.');
      } else {
        const createPayload: ProductCreatePayload = {
          ...payload,
          variants: [firstVariantPayload(productForm)],
        };
        await adminCatalogApi.createProduct(createPayload);
        reportSuccess('Product created with its first variant.');
      }
      resetProduct();
      productsState.reload();
      if (selectedProductId !== null) selectedProductState.reload();
    } catch (requestError) {
      reportError(requestError);
    } finally {
      setBusy(false);
    }
  }

  async function toggleProduct(product: AdminProduct) {
    setBusyId(`product-${product.id}`);
    setError('');
    try {
      await adminCatalogApi.setProductActive(product.id, !product.active);
      productsState.reload();
      reportSuccess(
        `Product ${product.active ? 'deactivated' : 'activated'}.`,
      );
    } catch (requestError) {
      reportError(requestError);
    } finally {
      setBusyId(null);
    }
  }

  async function saveVariant() {
    if (!selectedProduct || !variantForm) return;
    const adjustment = Number(variantForm.priceAdjustment || 0);
    const volume = Number(variantForm.volumeMl);
    if (!Number.isFinite(adjustment)) {
      setError('Enter a valid price adjustment.');
      return;
    }
    if (variantForm.volumeMl && (!Number.isFinite(volume) || volume <= 0)) {
      setError('Volume must be greater than zero.');
      return;
    }
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const payload = variantPayload(variantForm);
      if (variantForm.variantItemId !== null) {
        await adminCatalogApi.updateVariant(
          selectedProduct.id,
          variantForm.variantItemId,
          payload,
        );
        reportSuccess('Variant updated.');
      } else {
        await adminCatalogApi.addVariant(selectedProduct.id, payload);
        reportSuccess('Variant added.');
      }
      setVariantForm(null);
      selectedProductState.reload();
      productsState.reload();
    } catch (requestError) {
      reportError(requestError);
    } finally {
      setBusy(false);
    }
  }

  async function toggleVariant(variant: AdminVariant) {
    if (!selectedProduct) return;
    setBusyId(`variant-${variant.variantItemId}`);
    setError('');
    try {
      await adminCatalogApi.setVariantActive(
        selectedProduct.id,
        variant.variantItemId,
        !variant.active,
      );
      selectedProductState.reload();
      productsState.reload();
      reportSuccess(
        `Variant ${variant.active ? 'deactivated' : 'activated'}.`,
      );
    } catch (requestError) {
      reportError(requestError);
    } finally {
      setBusyId(null);
    }
  }

  async function setDefaultVariant(variant: AdminVariant) {
    if (!selectedProduct) return;
    setBusyId(`variant-${variant.variantItemId}`);
    setError('');
    try {
      await adminCatalogApi.setDefaultVariant(
        selectedProduct.id,
        variant.variantItemId,
      );
      selectedProductState.reload();
      productsState.reload();
      reportSuccess('Default variant updated.');
    } catch (requestError) {
      reportError(requestError);
    } finally {
      setBusyId(null);
    }
  }

  function editVariant(variant: AdminVariant) {
    setVariantForm(variantFormFrom(variant));
    setImageVariantId(null);
  }

  async function saveImage() {
    if (selectedProductId === null || imageVariantId === null) return;
    setError('');
    setNotice('');
    let url: URL;
    try {
      url = new URL(imageForm.imageUrl.trim());
    } catch {
      setError('Enter a valid image URL.');
      return;
    }
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      setError('Image URLs must use HTTP or HTTPS.');
      return;
    }
    const order = Number(imageForm.displayOrder);
    if (!Number.isInteger(order) || order < 0) {
      setError('Display order must be a non-negative whole number.');
      return;
    }
    setBusy(true);
    try {
      const payload: ProductImagePayload = {
        imageUrl: url.toString(),
        altText: imageForm.altText.trim() || null,
        displayOrder: order,
        main: imageForm.main,
      };
      if (editingImageId !== null) {
        await adminCatalogApi.updateImage(
          selectedProductId,
          imageVariantId,
          editingImageId,
          payload,
        );
        reportSuccess('Image updated.');
      } else {
        await adminCatalogApi.addImage(
          selectedProductId,
          imageVariantId,
          payload,
        );
        reportSuccess('Image added.');
      }
      setImageForm(EMPTY_IMAGE);
      setEditingImageId(null);
      imagesState.reload();
      selectedProductState.reload();
    } catch (requestError) {
      reportError(requestError);
    } finally {
      setBusy(false);
    }
  }

  async function removeImage(imageId: number) {
    if (selectedProductId === null || imageVariantId === null) return;
    setBusyId(`image-${imageId}`);
    setError('');
    try {
      await adminCatalogApi.removeImage(
        selectedProductId,
        imageVariantId,
        imageId,
      );
      setConfirmImageId(null);
      imagesState.reload();
      selectedProductState.reload();
      reportSuccess('Image removed.');
    } catch (requestError) {
      reportError(requestError);
    } finally {
      setBusyId(null);
    }
  }

  function editImage(image: NonNullable<typeof imagesState.data>[number]) {
    setEditingImageId(image.id);
    setImageForm({
      imageUrl: image.imageUrl,
      altText: image.altText ?? '',
      displayOrder: String(image.displayOrder),
      main: image.main,
    });
  }

  return (
    <AdminFrame
      title="Catalog management"
      subtitle="Manage categories, products, variants, and catalog images."
    >
      {error ? <Alert tone="error">{error}</Alert> : null}
      {notice ? <Alert tone="success">{notice}</Alert> : null}
      {categoriesState.error ? (
        <ErrorState
          message={`Categories: ${categoriesState.error}`}
          onRetry={categoriesState.reload}
        />
      ) : null}
      {productsState.error ? (
        <ErrorState
          message={`Products: ${productsState.error}`}
          onRetry={productsState.reload}
        />
      ) : null}
      <Card>
        <PageTitle title="Categories" subtitle="Create, edit, or deactivate categories." />
        <TextField
          label="Category name"
          value={categoryForm.name}
          onChangeText={(value) =>
            setCategoryForm((previous) => ({ ...previous, name: value }))
          }
          maxLength={100}
        />
        <SelectField
          label="Parent category"
          value={categoryForm.parentCategoryId}
          onChange={(value) =>
            setCategoryForm((previous) => ({
              ...previous,
              parentCategoryId: value,
            }))
          }
          options={parentOptions}
        />
        <View style={styles.actionRow}>
          <Button
            title={editingCategoryId !== null ? 'Save category' : 'Add category'}
            busy={busy}
            onPress={() => void saveCategory()}
          />
          {editingCategoryId !== null ? (
            <Button
              title="Cancel"
              variant="ghost"
              onPress={() => {
                setEditingCategoryId(null);
                setCategoryForm(EMPTY_CATEGORY);
              }}
            />
          ) : null}
        </View>
        {categories.map((category) => (
          <View key={category.id} style={styles.listItem}>
            <Text style={styles.itemTitle}>{category.name}</Text>
            <Text style={styles.muted}>
              {category.parentCategoryId
                ? `Parent #${category.parentCategoryId}`
                : 'Top level'}{' '}
              · {category.active ? 'Active' : 'Inactive'}
            </Text>
            <View style={styles.actionRow}>
              <Button
                title="Edit"
                variant="secondary"
                onPress={() => editCategory(category)}
              />
              <Button
                title={category.active ? 'Deactivate' : 'Activate'}
                variant="ghost"
                busy={busyId === `category-${category.id}`}
                onPress={() => void toggleCategory(category)}
              />
            </View>
          </View>
        ))}
      </Card>

      <Card>
        <View style={styles.heading}>
          <PageTitle
            title={`Products · ${products.total}`}
            subtitle="Filter this page and manage product details."
          />
          <Button
            title="New product"
            variant="secondary"
            onPress={() => {
              resetProduct();
              setSelectedProductId(null);
            }}
          />
        </View>
        <SelectField
          label="Category"
          value={categoryFilter}
          onChange={(value) => {
            setPage(0);
            setCategoryFilter(value);
          }}
          options={[
            { value: '', label: 'All categories' },
            ...categories.map((category) => ({
              value: String(category.id),
              label: category.name,
            })),
          ]}
        />
        <SelectField
          label="Product type"
          value={typeFilter}
          onChange={(value) => {
            setPage(0);
            setTypeFilter(value);
          }}
          options={[
            { value: '', label: 'All types' },
            ...PRODUCT_TYPES.map((value) => ({
              value,
              label: prettyStatus(value),
            })),
          ]}
        />
        <SelectField
          label="Status"
          value={activeFilter}
          onChange={(value) => {
            setPage(0);
            setActiveFilter(value);
          }}
          options={[
            { value: '', label: 'All statuses' },
            { value: 'true', label: 'Active' },
            { value: 'false', label: 'Inactive' },
          ]}
        />
        {!productsState.loading &&
        !productsState.error &&
        products.items.length === 0 ? (
          <EmptyState
            title="No products found"
            description="Create a product or change the filters."
          />
        ) : null}
        {products.items.map((product) => (
          <View key={product.id} style={styles.listItem}>
            <Text style={styles.itemTitle}>{product.name}</Text>
            <Text style={styles.muted}>
              {prettyStatus(product.type)} · {product.categoryName || 'Uncategorized'} ·{' '}
              {formatMoney(product.basePrice)} · {product.variants?.length ?? 0}{' '}
              variants
            </Text>
            <Text style={styles.muted}>
              {product.active ? 'Active' : 'Inactive'}
            </Text>
            <View style={styles.actionRow}>
              <Button
                title="Edit"
                variant="secondary"
                onPress={() => editProduct(product)}
              />
              <Button
                title={
                  selectedProductId === product.id
                    ? 'Variants selected'
                    : 'Manage variants'
                }
                variant="secondary"
                busy={
                  selectedProductId === product.id &&
                  selectedProductState.loading
                }
                onPress={() => {
                  setSelectedProductId(product.id);
                  setVariantForm(null);
                  setImageVariantId(null);
                }}
              />
              <Button
                title={product.active ? 'Deactivate' : 'Activate'}
                variant="ghost"
                busy={busyId === `product-${product.id}`}
                onPress={() => void toggleProduct(product)}
              />
            </View>
          </View>
        ))}
        <Pagination
          page={products.page}
          totalPages={products.totalPages}
          onChange={(value) => {
            setPage(value);
            setSelectedProductId(null);
          }}
        />
      </Card>

      <Card>
        <PageTitle
          title={editingProductId !== null ? 'Edit product' : 'Create product'}
          subtitle="Product type cannot be changed after creation. Prices are entered in EGP."
        />
        <SelectField
          label="Product type"
          value={productForm.type}
          disabled={editingProductId !== null}
          onChange={(value) =>
            setProductForm({
              ...EMPTY_PRODUCT,
              type: isProductType(value) ? value : 'CLOTHING',
            })
          }
          options={PRODUCT_TYPES.map((value) => ({
            value,
            label: prettyStatus(value),
          }))}
        />
        <SelectField
          label="Category"
          value={productForm.categoryId}
          onChange={(value) =>
            setProductForm((previous) => ({ ...previous, categoryId: value }))
          }
          options={categoryOptions}
        />
        <TextField
          label="Product name"
          value={productForm.name}
          onChangeText={(value) =>
            setProductForm((previous) => ({ ...previous, name: value }))
          }
          maxLength={200}
        />
        <TextField
          label="Base price (EGP)"
          value={productForm.basePrice}
          onChangeText={(value) =>
            setProductForm((previous) => ({ ...previous, basePrice: value }))
          }
          keyboardType="decimal-pad"
        />
        {editingProductId === null ? (
          <TextField
            label="First variant price adjustment"
            value={productForm.priceAdjustment}
            onChangeText={(value) =>
              setProductForm((previous) => ({
                ...previous,
                priceAdjustment: value,
              }))
            }
            keyboardType="decimal-pad"
          />
        ) : null}
        {productForm.type === 'CLOTHING' ? (
          <>
            <TextField
              label="Clothing type"
              value={productForm.clothingType}
              onChangeText={(value) =>
                setProductForm((previous) => ({
                  ...previous,
                  clothingType: value,
                }))
              }
              maxLength={80}
            />
            <TextField
              label="Material"
              value={productForm.material}
              onChangeText={(value) =>
                setProductForm((previous) => ({
                  ...previous,
                  material: value,
                }))
              }
              maxLength={120}
            />
            {editingProductId === null ? (
              <>
                <TextField
                  label="First variant size"
                  value={productForm.size}
                  onChangeText={(value) =>
                    setProductForm((previous) => ({
                      ...previous,
                      size: value,
                    }))
                  }
                  maxLength={30}
                />
                <TextField
                  label="First variant color"
                  value={productForm.color}
                  onChangeText={(value) =>
                    setProductForm((previous) => ({
                      ...previous,
                      color: value,
                    }))
                  }
                  maxLength={60}
                />
              </>
            ) : null}
          </>
        ) : null}
        {productForm.type === 'ACCESSORY' ? (
          <>
            <TextField
              label="Accessory type"
              value={productForm.accessoryType}
              onChangeText={(value) =>
                setProductForm((previous) => ({
                  ...previous,
                  accessoryType: value,
                }))
              }
              maxLength={80}
            />
            <TextField
              label="Material"
              value={productForm.material}
              onChangeText={(value) =>
                setProductForm((previous) => ({
                  ...previous,
                  material: value,
                }))
              }
              maxLength={120}
            />
            {editingProductId === null ? (
              <TextField
                label="First variant color (optional)"
                value={productForm.color}
                onChangeText={(value) =>
                  setProductForm((previous) => ({ ...previous, color: value }))
                }
                maxLength={60}
              />
            ) : null}
          </>
        ) : null}
        {productForm.type === 'SKINCARE' ? (
          <>
            <TextField
              label="Skincare type"
              value={productForm.skincareType}
              onChangeText={(value) =>
                setProductForm((previous) => ({
                  ...previous,
                  skincareType: value,
                }))
              }
              maxLength={80}
            />
            <TextField
              label="Skin type"
              value={productForm.skinType}
              onChangeText={(value) =>
                setProductForm((previous) => ({
                  ...previous,
                  skinType: value,
                }))
              }
              maxLength={100}
            />
            {editingProductId === null ? (
              <>
                <TextField
                  label="First variant volume (ml)"
                  value={productForm.volumeMl}
                  onChangeText={(value) =>
                    setProductForm((previous) => ({
                      ...previous,
                      volumeMl: value,
                    }))
                  }
                  keyboardType="decimal-pad"
                />
                <TextField
                  label="First variant size label"
                  value={productForm.sizeLabel}
                  onChangeText={(value) =>
                    setProductForm((previous) => ({
                      ...previous,
                      sizeLabel: value,
                    }))
                  }
                  maxLength={40}
                />
                <TextField
                  label="First variant formulation"
                  value={productForm.formulation}
                  onChangeText={(value) =>
                    setProductForm((previous) => ({
                      ...previous,
                      formulation: value,
                    }))
                  }
                  maxLength={120}
                />
              </>
            ) : null}
          </>
        ) : null}
        {editingProductId === null ? (
          <TextField
            label="First variant description"
            value={productForm.additionalDescription}
            onChangeText={(value) =>
              setProductForm((previous) => ({
                ...previous,
                additionalDescription: value,
              }))
            }
            maxLength={1000}
          />
        ) : null}
        <TextField
          label="Short description"
          value={productForm.description}
          onChangeText={(value) =>
            setProductForm((previous) => ({
              ...previous,
              description: value,
            }))
          }
          maxLength={1000}
          multiline
        />
        <TextField
          label="Details"
          value={productForm.details}
          onChangeText={(value) =>
            setProductForm((previous) => ({ ...previous, details: value }))
          }
          multiline
        />
        <View style={styles.actionRow}>
          <Button
            title={editingProductId !== null ? 'Save product' : 'Create product'}
            busy={busy}
            onPress={() => void saveProduct()}
          />
          {editingProductId !== null ? (
            <Button title="Cancel edit" variant="ghost" onPress={resetProduct} />
          ) : null}
        </View>
      </Card>

      {selectedProduct ? (
        <Card>
          <PageTitle
            title={`Variants & images · ${selectedProduct.name}`}
            subtitle="Manage stock options and their product images."
          />
          {selectedProduct.variants?.map((variant) => (
            <View key={variant.variantItemId} style={styles.listItem}>
              <Text style={styles.itemTitle}>{variantLabel(variant)}</Text>
              <Text style={styles.muted}>
                ID {variant.variantItemId} · {variant.stockQuantity} in stock ·{' '}
                {formatMoney(variant.regularPrice)}
              </Text>
              <Text style={styles.muted}>
                {variant.active ? 'Active' : 'Inactive'}
                {variant.defaultVariant ? ' · Default' : ''}
              </Text>
              <View style={styles.actionRow}>
                <Button
                  title="Edit"
                  variant="secondary"
                  onPress={() => editVariant(variant)}
                />
                {!variant.defaultVariant ? (
                  <Button
                    title="Make default"
                    variant="secondary"
                    busy={busyId === `variant-${variant.variantItemId}`}
                    onPress={() => void setDefaultVariant(variant)}
                  />
                ) : null}
                <Button
                  title={variant.active ? 'Deactivate' : 'Activate'}
                  variant="ghost"
                  busy={busyId === `variant-${variant.variantItemId}`}
                  onPress={() => void toggleVariant(variant)}
                />
                <Button
                  title={
                    imageVariantId === variant.variantItemId
                      ? 'Images selected'
                      : 'Manage images'
                  }
                  variant="secondary"
                  onPress={() => {
                    setImageVariantId(variant.variantItemId);
                    setEditingImageId(null);
                    setImageForm(EMPTY_IMAGE);
                  }}
                />
              </View>
            </View>
          ))}
          {selectedProduct.variants?.length === 0 ? (
            <Text style={styles.muted}>No variants have been added.</Text>
          ) : null}
          {variantForm ? (
            <View style={styles.formBlock}>
              <PageTitle
                title={
                  variantForm.variantItemId === null
                    ? 'Add variant'
                    : 'Edit variant'
                }
              />
              <VariantFields
                form={variantForm}
                setForm={setVariantForm}
              />
              <Button
                title="Save variant"
                busy={busy}
                onPress={() => void saveVariant()}
              />
              <Button
                title="Cancel"
                variant="ghost"
                onPress={() => setVariantForm(null)}
              />
            </View>
          ) : (
            <Button
              title="Add variant"
              variant="secondary"
              onPress={() => setVariantForm(EMPTY_VARIANT)}
            />
          )}
          {imageVariantId !== null && selectedVariant ? (
            <View style={styles.formBlock}>
              <PageTitle
                title={`Images for ${variantLabel(selectedVariant)}`}
                subtitle={`Variant #${imageVariantId}`}
              />
              {imagesState.error ? (
                <ErrorState
                  message={imagesState.error}
                  onRetry={imagesState.reload}
                />
              ) : null}
              {(imagesState.data ?? []).map((image) => (
                <View key={image.id} style={styles.listItem}>
                  <Text style={styles.itemTitle}>
                    {image.main ? 'Main image' : `Image order ${image.displayOrder}`}
                  </Text>
                  <Text style={styles.muted} numberOfLines={2}>
                    {image.imageUrl}
                  </Text>
                  {image.altText ? (
                    <Text style={styles.muted}>{image.altText}</Text>
                  ) : null}
                  <View style={styles.actionRow}>
                    <Button
                      title="Edit image"
                      variant="secondary"
                      onPress={() => editImage(image)}
                    />
                    {confirmImageId === image.id ? (
                      <Button
                        title="Confirm remove"
                        busy={busyId === `image-${image.id}`}
                        onPress={() => void removeImage(image.id)}
                      />
                    ) : (
                      <Button
                        title="Remove"
                        variant="ghost"
                        onPress={() => setConfirmImageId(image.id)}
                      />
                    )}
                  </View>
                </View>
              ))}
              <TextField
                label="Image URL"
                value={imageForm.imageUrl}
                onChangeText={(value) =>
                  setImageForm((previous) => ({
                    ...previous,
                    imageUrl: value,
                  }))
                }
                keyboardType="url"
                autoCapitalize="none"
                maxLength={2048}
              />
              <TextField
                label="Alt text"
                value={imageForm.altText}
                onChangeText={(value) =>
                  setImageForm((previous) => ({
                    ...previous,
                    altText: value,
                  }))
                }
                maxLength={255}
              />
              <TextField
                label="Display order"
                value={imageForm.displayOrder}
                onChangeText={(value) =>
                  setImageForm((previous) => ({
                    ...previous,
                    displayOrder: value,
                  }))
                }
                keyboardType="number-pad"
              />
              <Button
                title={
                  imageForm.main
                    ? '✓ Set as main image'
                    : 'Set as main image'
                }
                variant="secondary"
                onPress={() =>
                  setImageForm((previous) => ({
                    ...previous,
                    main: !previous.main,
                  }))
                }
              />
              <Button
                title={editingImageId !== null ? 'Save image' : 'Add image'}
                busy={busy}
                onPress={() => void saveImage()}
              />
              {editingImageId !== null ? (
                <Button
                  title="Cancel image edit"
                  variant="ghost"
                  onPress={() => {
                    setEditingImageId(null);
                    setImageForm(EMPTY_IMAGE);
                  }}
                />
              ) : null}
            </View>
          ) : null}
        </Card>
      ) : selectedProductState.error ? (
        <ErrorState
          message={selectedProductState.error}
          onRetry={selectedProductState.reload}
        />
      ) : null}
    </AdminFrame>
  );
}

function VariantFields({
  form,
  setForm,
}: {
  form: VariantForm;
  setForm: (value: VariantForm | null | ((previous: VariantForm | null) => VariantForm | null)) => void;
}) {
  function change<K extends keyof VariantForm>(
    key: K,
    value: VariantForm[K],
  ) {
    setForm((previous) => (previous ? { ...previous, [key]: value } : null));
  }

  return (
    <>
      <TextField
        label="Size"
        value={form.size}
        onChangeText={(value) => change('size', value)}
      />
      <TextField
        label="Color"
        value={form.color}
        onChangeText={(value) => change('color', value)}
      />
      <TextField
        label="Material"
        value={form.material}
        onChangeText={(value) => change('material', value)}
      />
      <TextField
        label="Volume (ml)"
        value={form.volumeMl}
        onChangeText={(value) => change('volumeMl', value)}
        keyboardType="decimal-pad"
      />
      <TextField
        label="Size label"
        value={form.sizeLabel}
        onChangeText={(value) => change('sizeLabel', value)}
      />
      <TextField
        label="Formulation"
        value={form.formulation}
        onChangeText={(value) => change('formulation', value)}
      />
      <TextField
        label="Price adjustment"
        value={form.priceAdjustment}
        onChangeText={(value) => change('priceAdjustment', value)}
        keyboardType="decimal-pad"
      />
      <TextField
        label="Additional description"
        value={form.additionalDescription}
        onChangeText={(value) => change('additionalDescription', value)}
      />
      <Button
        title={
          form.makeDefault
            ? '✓ Make default variant'
            : 'Make default variant'
        }
        variant="secondary"
        onPress={() => change('makeDefault', !form.makeDefault)}
      />
    </>
  );
}

function createStyles(theme: ReturnType<typeof useAppTheme>['theme']) {
  return StyleSheet.create({
  heading: {
    gap: 12,
  },
  listItem: {
    paddingVertical: 11,
    gap: 7,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.line,
  },
  itemTitle: {
    color: theme.colors.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  muted: {
    color: theme.colors.muted,
    fontSize: 13,
    lineHeight: 19,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formBlock: {
    paddingTop: 16,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.line,
  },
  });
}
