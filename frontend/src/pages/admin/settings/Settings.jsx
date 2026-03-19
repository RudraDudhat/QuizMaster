import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import toast from 'react-hot-toast';
import { Folder, Tag as TagIcon, Search, AlertCircle, Trash2, Settings as SettingsIcon } from 'lucide-react';

import { getAllCategories, createCategory, updateCategory, deleteCategory } from '../../../api/category.api';
import { getAllTags, createTag, deleteTag } from '../../../api/tag.api';
import { formatDate, truncateText } from '../../../utils/formatters';

import Tabs from '../../../components/ui/Tabs';
import Card from '../../../components/ui/Card';
import Button from '../../../components/common/Button';
import Input from '../../../components/common/Input';
import Textarea from '../../../components/common/Textarea';
import Badge from '../../../components/common/Badge';
import EmptyState from '../../../components/common/EmptyState';
import Modal from '../../../components/common/Modal';

const categorySchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be at most 100 characters'),
    description: z.string().max(500, 'Description must be at most 500 characters').optional().or(z.literal('')),
});

const tagSchema = z.object({
    name: z.string().min(1, 'Name is required').max(80, 'Name must be at most 80 characters'),
});

export default function Settings() {
    const [activeTab, setActiveTab] = useState('categories');

    const [catDeleteModal, setCatDeleteModal] = useState({
        open: false,
        uuid: null,
        name: '',
        quizCount: 0,
    });
    const [catEditModal, setCatEditModal] = useState({
        open: false,
        uuid: null,
        name: '',
        description: '',
    });

    const [tagDeleteModal, setTagDeleteModal] = useState({
        open: false,
        uuid: null,
        name: '',
        quizCount: 0,
        questionCount: 0,
    });
    const [showUnusedOnly, setShowUnusedOnly] = useState(false);
    const [tagSearch, setTagSearch] = useState('');

    const {
        register: registerCategory,
        handleSubmit: handleSubmitCategory,
        reset: resetCategoryForm,
        formState: { errors: categoryErrors, isSubmitting: categorySubmitting },
    } = useForm({
        resolver: zodResolver(categorySchema),
        defaultValues: { name: '', description: '' },
    });

    const {
        register: registerTag,
        handleSubmit: handleSubmitTag,
        reset: resetTagForm,
        formState: { errors: tagErrors, isSubmitting: tagSubmitting },
    } = useForm({
        resolver: zodResolver(tagSchema),
        defaultValues: { name: '' },
    });

    const {
        data: catResponse,
        isLoading: catLoading,
        refetch: refetchCats,
    } = useQuery({
        queryKey: ['admin-categories'],
        queryFn: getAllCategories,
        staleTime: 30_000,
    });
    const categories = catResponse?.data ?? [];

    const {
        data: tagResponse,
        isLoading: tagLoading,
        refetch: refetchTags,
    } = useQuery({
        queryKey: ['admin-tags'],
        queryFn: getAllTags,
        staleTime: 30_000,
    });
    const allTags = tagResponse?.data ?? [];

    const filteredTags = useMemo(
        () =>
            allTags
                .filter((t) =>
                    showUnusedOnly ? t.quizCount === 0 && t.questionCount === 0 : true
                )
                .filter((t) =>
                    t.name.toLowerCase().includes(tagSearch.toLowerCase())
                ),
        [allTags, showUnusedOnly, tagSearch]
    );

    const createCategoryMut = useMutation({
        mutationFn: ({ name, description }) => createCategory({ name, description }),
        onSuccess: () => {
            toast.success('Category created!');
            refetchCats();
            resetCategoryForm();
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || 'Failed to create category');
        },
    });

    const updateCategoryMut = useMutation({
        mutationFn: ({ uuid, name, description }) => updateCategory(uuid, { name, description }),
        onSuccess: () => {
            toast.success('Category updated!');
            refetchCats();
            setCatEditModal({ open: false, uuid: null, name: '', description: '' });
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || 'Failed to update category');
        },
    });

    const deleteCategoryMut = useMutation({
        mutationFn: ({ uuid }) => deleteCategory(uuid),
        onSuccess: () => {
            toast.success('Category deleted!');
            refetchCats();
            setCatDeleteModal({ open: false, uuid: null, name: '', quizCount: 0 });
        },
        onError: (error) => {
            toast.error(
                error?.response?.data?.message ||
                    'Failed to delete category'
            );
        },
    });

    const createTagMut = useMutation({
        mutationFn: ({ name }) => createTag({ name }),
        onSuccess: () => {
            toast.success('Tag created!');
            refetchTags();
            resetTagForm();
        },
        onError: (error) => {
            toast.error(error?.response?.data?.message || 'Failed to create tag');
        },
    });

    const deleteTagMut = useMutation({
        mutationFn: ({ uuid }) => deleteTag(uuid),
        onSuccess: () => {
            toast.success('Tag deleted!');
            refetchTags();
            setTagDeleteModal({
                open: false,
                uuid: null,
                name: '',
                quizCount: 0,
                questionCount: 0,
            });
        },
        onError: (error) => {
            toast.error(
                'Cannot delete this tag: ' +
                    (error?.response?.data?.message ??
                        'it is still in use')
            );
        },
    });

    const onCreateCategory = (values) => {
        createCategoryMut.mutate({
            name: values.name.trim(),
            description: values.description || '',
        });
    };

    const onCreateTag = (values) => {
        createTagMut.mutate({ name: values.name.trim() });
    };

    const onSaveCategoryEdit = () => {
        const { uuid, name, description } = catEditModal;
        if (!uuid || !name.trim()) return;
        updateCategoryMut.mutate({
            uuid,
            name: name.trim(),
            description: description || '',
        });
    };

    const tabs = [
        {
            key: 'categories',
            label: '📁 Categories',
            count: categories.length,
        },
        {
            key: 'tags',
            label: '🏷️ Tags',
            count: allTags.length,
        },
    ];

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                        <SettingsIcon size={20} className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                        <p className="text-sm text-gray-500">
                            Manage categories, tags and platform configuration
                        </p>
                    </div>
                </div>
            </div>

            <Card padding="md">
                <Tabs
                    tabs={tabs}
                    activeTab={activeTab}
                    onChange={setActiveTab}
                    variant="underline"
                />

                {activeTab === 'categories' && (
                    <div className="mt-6 grid gap-6 lg:grid-cols-[0.38fr_0.62fr]">
                        <Card padding="md" className="bg-gray-50/60 border-dashed">
                            <h2 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                                <Folder size={16} className="text-primary" />
                                Add New Category
                            </h2>
                            <p className="text-xs text-gray-500 mb-4">
                                Organize your quizzes into logical groups.
                            </p>

                            <form
                                className="space-y-4"
                                onSubmit={handleSubmitCategory(onCreateCategory)}
                            >
                                <Input
                                    label="Category Name"
                                    name="name"
                                    placeholder="e.g. Programming, Science..."
                                    prefixIcon={<Folder size={14} />}
                                    required
                                    register={registerCategory('name')}
                                    error={categoryErrors.name?.message}
                                />

                                <Textarea
                                    label="Description"
                                    name="description"
                                    rows={2}
                                    placeholder="Optional description..."
                                    register={registerCategory('description')}
                                    error={categoryErrors.description?.message}
                                />

                                <Button
                                    type="submit"
                                    variant="primary"
                                    fullWidth
                                    loading={createCategoryMut.isPending || categorySubmitting}
                                >
                                    Add Category
                                </Button>
                            </form>
                        </Card>

                        <Card padding="md">
                            <div className="flex items-center justify-between mb-4">
                                <div>
                                    <h2 className="text-sm font-semibold text-gray-900">
                                        All Categories
                                    </h2>
                                    <p className="text-xs text-gray-500">
                                        {categories.length} categories total
                                    </p>
                                </div>
                            </div>

                            {catLoading ? (
                                <div className="space-y-2">
                                    {Array.from({ length: 5 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="h-10 rounded-lg bg-gray-100 animate-pulse"
                                        />
                                    ))}
                                </div>
                            ) : categories.length === 0 ? (
                                <EmptyState
                                    icon={<Folder size={40} />}
                                    title="No categories yet"
                                    description="Add your first category above"
                                />
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-100 text-xs text-gray-500">
                                                <th className="py-2 pr-4 font-medium">Name</th>
                                                <th className="py-2 pr-4 font-medium">
                                                    Description
                                                </th>
                                                <th className="py-2 pr-4 font-medium text-center">
                                                    Quizzes Using It
                                                </th>
                                                <th className="py-2 pr-4 font-medium">
                                                    Created
                                                </th>
                                                <th className="py-2 pl-4 font-medium text-right">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {categories.map((category) => (
                                                <tr
                                                    key={category.uuid}
                                                    className="border-b border-gray-50 last:border-0"
                                                >
                                                    <td className="py-2 pr-4 align-top">
                                                        <div className="font-semibold text-gray-900">
                                                            {category.name}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            {category.slug}
                                                        </div>
                                                    </td>
                                                    <td className="py-2 pr-4 align-top text-xs text-gray-700">
                                                        {category.description
                                                            ? truncateText(
                                                                  category.description,
                                                                  40
                                                              )
                                                            : '—'}
                                                    </td>
                                                    <td className="py-2 pr-4 align-top text-center">
                                                        <div className="flex items-center justify-center">
                                                            {category.quizCount > 0 ? (
                                                                <Badge variant="info" size="sm">
                                                                    {category.quizCount}{' '}
                                                                    quizzes
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="default" size="sm">
                                                                    Unused
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-2 pr-4 align-top text-xs text-gray-600 whitespace-nowrap">
                                                        {formatDate(category.createdAt)}
                                                    </td>
                                                    <td className="py-2 pl-4 align-top text-right">
                                                        <div className="inline-flex items-center gap-2">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-xs h-8 px-3"
                                                                onClick={() =>
                                                                    setCatEditModal({
                                                                        open: true,
                                                                        uuid: category.uuid,
                                                                        name: category.name,
                                                                        description:
                                                                            category.description ||
                                                                            '',
                                                                    })
                                                                }
                                                            >
                                                                Edit
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-xs h-8 px-3 border-red-200 text-red-600 hover:bg-red-50"
                                                                onClick={() =>
                                                                    setCatDeleteModal({
                                                                        open: true,
                                                                        uuid: category.uuid,
                                                                        name: category.name,
                                                                        quizCount:
                                                                            category.quizCount ?? 0,
                                                                    })
                                                                }
                                                            >
                                                                Delete
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    </div>
                )}

                {activeTab === 'tags' && (
                    <div className="mt-6 grid gap-6 lg:grid-cols-[0.38fr_0.62fr]">
                        <Card padding="md" className="bg-gray-50/60 border-dashed">
                            <h2 className="text-sm font-semibold text-gray-900 mb-1 flex items-center gap-2">
                                <TagIcon size={16} className="text-primary" />
                                Add New Tag
                            </h2>
                            <p className="text-xs text-gray-500 mb-4">
                                Create reusable tags for quizzes and questions.
                            </p>

                            <form
                                className="space-y-4"
                                onSubmit={handleSubmitTag(onCreateTag)}
                            >
                                <Input
                                    label="Tag Name"
                                    name="name"
                                    placeholder="e.g. javascript, c++, arrays..."
                                    prefixIcon={<TagIcon size={14} />}
                                    required
                                    register={registerTag('name')}
                                    error={tagErrors.name?.message}
                                />
                                <p className="text-xs text-gray-400">
                                    Special characters like +, # are supported
                                </p>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    fullWidth
                                    loading={createTagMut.isPending || tagSubmitting}
                                >
                                    Add Tag
                                </Button>
                            </form>
                        </Card>

                        <Card padding="md">
                            <div className="flex flex-col gap-3">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                                    <Input
                                        name="tagSearch"
                                        placeholder="Search tags..."
                                        prefixIcon={<Search size={14} />}
                                        value={tagSearch}
                                        onChange={(e) => setTagSearch(e.target.value)}
                                    />
                                    <label className="inline-flex items-center gap-2 text-xs text-gray-700">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setShowUnusedOnly((prev) => !prev)
                                            }
                                            className={`relative inline-flex h-5 w-9 items-center rounded-full border transition-colors ${
                                                showUnusedOnly
                                                    ? 'bg-primary border-primary'
                                                    : 'bg-gray-200 border-gray-300'
                                            }`}
                                        >
                                            <span
                                                className={`inline-block h-4 w-4 rounded-full bg-white shadow transform transition-transform ${
                                                    showUnusedOnly
                                                        ? 'translate-x-4'
                                                        : 'translate-x-0.5'
                                                }`}
                                            />
                                        </button>
                                        <span>Unused only</span>
                                    </label>
                                </div>

                                <p className="text-xs text-gray-500">
                                    {filteredTags.length} tags
                                    {showUnusedOnly ? ' (unused only)' : ''}
                                </p>
                            </div>

                            {tagLoading ? (
                                <div className="mt-4 space-y-2">
                                    {Array.from({ length: 8 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className="h-10 rounded-lg bg-gray-100 animate-pulse"
                                        />
                                    ))}
                                </div>
                            ) : filteredTags.length === 0 ? (
                                <div className="mt-4">
                                    <EmptyState
                                        icon={<TagIcon size={40} />}
                                        title="No tags found"
                                        description={
                                            showUnusedOnly
                                                ? 'No unused tags. All tags are in use!'
                                                : 'Add your first tag above'
                                        }
                                    />
                                </div>
                            ) : (
                                <div className="mt-4 overflow-x-auto">
                                    <table className="min-w-full text-left text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-100 text-xs text-gray-500">
                                                <th className="py-2 pr-4 font-medium">Name</th>
                                                <th className="py-2 pr-4 font-medium text-center">
                                                    Used in Quizzes
                                                </th>
                                                <th className="py-2 pr-4 font-medium text-center">
                                                    Used in Questions
                                                </th>
                                                <th className="py-2 pr-4 font-medium">
                                                    Status
                                                </th>
                                                <th className="py-2 pl-4 font-medium text-right">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filteredTags.map((tag) => (
                                                <tr
                                                    key={tag.uuid}
                                                    className="border-b border-gray-50 last:border-0"
                                                >
                                                    <td className="py-2 pr-4 align-top">
                                                        <div className="font-semibold text-gray-900">
                                                            {tag.name}
                                                        </div>
                                                        <div className="text-xs text-gray-400">
                                                            {tag.slug}
                                                        </div>
                                                    </td>
                                                    <td className="py-2 pr-4 align-top text-center">
                                                        <div className="flex items-center justify-center">
                                                            {tag.quizCount > 0 ? (
                                                                <Badge variant="info" size="sm">
                                                                    {tag.quizCount} quizzes
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="default" size="sm">
                                                                    —
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-2 pr-4 align-top text-center">
                                                        <div className="flex items-center justify-center">
                                                            {tag.questionCount > 0 ? (
                                                                <Badge variant="info" size="sm">
                                                                    {tag.questionCount} questions
                                                                </Badge>
                                                            ) : (
                                                                <Badge variant="default" size="sm">
                                                                    —
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="py-2 pr-4 align-top">
                                                        {tag.quizCount === 0 &&
                                                        tag.questionCount === 0 ? (
                                                            <Badge variant="warning" size="sm">
                                                                Unused
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="success" size="sm">
                                                                In use
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="py-2 pl-4 align-top text-right">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="text-xs h-8 px-3 border-red-200 text-red-600 hover:bg-red-50"
                                                            onClick={() =>
                                                                setTagDeleteModal({
                                                                    open: true,
                                                                    uuid: tag.uuid,
                                                                    name: tag.name,
                                                                    quizCount:
                                                                        tag.quizCount ?? 0,
                                                                    questionCount:
                                                                        tag.questionCount ?? 0,
                                                                })
                                                            }
                                                        >
                                                            Delete
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </Card>
                    </div>
                )}
            </Card>

            <Modal
                isOpen={catEditModal.open}
                onClose={() =>
                    setCatEditModal({
                        open: false,
                        uuid: null,
                        name: '',
                        description: '',
                    })
                }
                title="Edit Category"
                size="sm"
                footer={
                    <>
                        <Button
                            variant="outline"
                            onClick={() =>
                                setCatEditModal({
                                    open: false,
                                    uuid: null,
                                    name: '',
                                    description: '',
                                })
                            }
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            loading={updateCategoryMut.isPending}
                            onClick={onSaveCategoryEdit}
                        >
                            Save
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Input
                        label="Category Name"
                        name="editCategoryName"
                        required
                        value={catEditModal.name}
                        onChange={(e) =>
                            setCatEditModal((prev) => ({
                                ...prev,
                                name: e.target.value,
                            }))
                        }
                    />
                    <Textarea
                        label="Description"
                        name="editCategoryDescription"
                        rows={2}
                        value={catEditModal.description}
                        onChange={(e) =>
                            setCatEditModal((prev) => ({
                                ...prev,
                                description: e.target.value,
                            }))
                        }
                    />
                </div>
            </Modal>

            <Modal
                isOpen={catDeleteModal.open}
                onClose={() =>
                    setCatDeleteModal({
                        open: false,
                        uuid: null,
                        name: '',
                        quizCount: 0,
                    })
                }
                title="Delete Category"
                size="sm"
                footer={
                    catDeleteModal.quizCount > 0
                        ? (
                            <Button
                                variant="primary"
                                onClick={() =>
                                    setCatDeleteModal({
                                        open: false,
                                        uuid: null,
                                        name: '',
                                        quizCount: 0,
                                    })
                                }
                            >
                                Got it
                            </Button>
                        )
                        : (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        setCatDeleteModal({
                                            open: false,
                                            uuid: null,
                                            name: '',
                                            quizCount: 0,
                                        })
                                    }
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="danger"
                                    loading={deleteCategoryMut.isPending}
                                    onClick={() =>
                                        deleteCategoryMut.mutate({
                                            uuid: catDeleteModal.uuid,
                                        })
                                    }
                                >
                                    Delete
                                </Button>
                            </>
                        )
                }
            >
                {catDeleteModal.quizCount > 0 ? (
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                            <AlertCircle size={40} className="text-red-500" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900">
                            Cannot Delete
                        </h3>
                        <p className="text-sm text-gray-600">
                            &apos;{catDeleteModal.name}&apos; is used in{' '}
                            {catDeleteModal.quizCount} quiz(zes). Reassign those
                            quizzes to a different category before deleting.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                            <Trash2 size={40} className="text-red-500" />
                        </div>
                        <p className="text-sm text-gray-700">
                            Are you sure you want to delete:
                        </p>
                        <p className="text-base font-bold text-gray-900">
                            {catDeleteModal.name}
                        </p>
                        <p className="text-xs text-gray-500">
                            This action cannot be undone.
                        </p>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={tagDeleteModal.open}
                onClose={() =>
                    setTagDeleteModal({
                        open: false,
                        uuid: null,
                        name: '',
                        quizCount: 0,
                        questionCount: 0,
                    })
                }
                title="Delete Tag"
                size="sm"
                footer={
                    tagDeleteModal.quizCount > 0 || tagDeleteModal.questionCount > 0
                        ? (
                            <Button
                                variant="primary"
                                onClick={() =>
                                    setTagDeleteModal({
                                        open: false,
                                        uuid: null,
                                        name: '',
                                        quizCount: 0,
                                        questionCount: 0,
                                    })
                                }
                            >
                                Got it
                            </Button>
                        )
                        : (
                            <>
                                <Button
                                    variant="outline"
                                    onClick={() =>
                                        setTagDeleteModal({
                                            open: false,
                                            uuid: null,
                                            name: '',
                                            quizCount: 0,
                                            questionCount: 0,
                                        })
                                    }
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="danger"
                                    loading={deleteTagMut.isPending}
                                    onClick={() =>
                                        deleteTagMut.mutate({
                                            uuid: tagDeleteModal.uuid,
                                        })
                                    }
                                >
                                    Delete
                                </Button>
                            </>
                        )
                }
            >
                {tagDeleteModal.quizCount > 0 ||
                tagDeleteModal.questionCount > 0 ? (
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                            <AlertCircle size={40} className="text-red-500" />
                        </div>
                        <h3 className="text-base font-semibold text-gray-900">
                            Cannot Delete
                        </h3>
                        <p className="text-sm text-gray-600">
                            &apos;{tagDeleteModal.name}&apos; is currently used in{' '}
                            {tagDeleteModal.quizCount} quiz(zes) and{' '}
                            {tagDeleteModal.questionCount} question(s). Remove it
                            from those first.
                        </p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center text-center gap-3">
                        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                            <Trash2 size={40} className="text-red-500" />
                        </div>
                        <p className="text-sm text-gray-700">
                            Are you sure you want to delete tag:
                        </p>
                        <p className="text-base font-bold text-gray-900">
                            {tagDeleteModal.name}
                        </p>
                        <p className="text-xs text-gray-500">
                            This action cannot be undone.
                        </p>
                    </div>
                )}
            </Modal>
        </div>
    );
}

