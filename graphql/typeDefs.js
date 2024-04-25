var { gql } = require("apollo-server-express");
module.exports = gql`
scalar Date

type Subscription {
  refreshfoldercallback: RefreshFolderWithNewCount
  refreshfoldercallbackall: Boolean
  transcriptionchangedcallbackall: TranscriptionData
}
type TranscriptionData {
  folderId: ID!
  fileId: ID!
  userId: ID!
  username: String!
  transcriptionHTML:String!
  truncatedTranscriptionText:String!
}
type RefreshFolderWithNewCount {
  folderId: String!
  newFileIds: [Int]
  deletedFileIds:[Int]
  notDeletedFileIds:[Int]
}
type FilesData {
  folderId: String!
  files: [Files]
}
type FilesDataWithNotify {
  folderId: String!
  files: [Files]
  notify:Boolean!
}
type FilesDataArchive {
  currentDateTime: String!
  folderId: String
  searchText: String!
  startDate: String!
  endDate: String!
  files: [Files]
}
input FileInput {
  id: ID
  preview: String
  filename: String
  createdAt: Date
  extension: String
  transcription: String
  folderId: ID
  moreInfo: String
  deleted: Boolean
  size:Int
}
input FileDeleteInput {
  id: ID
  deleted: Boolean
  folderId: ID
}
input FileUpdateInput {
  id: ID
  preview: String
  moreInfo: String
  folderId: ID
  size:Int
}
type Files {
  id: ID
  preview: String
  filename: String!
  createdAt:Date
  extension: String
  truncatedTranscriptionText:String
  folder: FoldersPath
  moreInfo: String
  deleted: Boolean
  size:Int
}
type FilesExport {
  id: ID
  preview: String
  filename: String
  createdAt:Date
  extension: String
  transcriptionText:String
  transcription:String
  folder: FoldersPath
  moreInfo: String
  deleted: Boolean
  lastModBy:String
}
  enum RoleType {
    Admin
    User
  }
  enum StatusType {
    Block
    Active
  }
  type FilesDetailsDownloadHistory {
    id: ID
    username: String
    country_code: String
    contact_no: String
    filename: String
    createdAt:Date
    extension: String
    folder: FoldersPath
    moreInfo: String
    deleted: Boolean
    designation: Designations
  }
  type ViewHistory {
    id: ID
    user:User
    createdAt:Date
    
  }

  type User {
    id: ID!
    name: String!
    avatar: String
    email: String
    country_code: String
    contact_no: String
    status: StatusType!
    block_comments:String
    role: RoleType!
    username: String!
    password: String!
    settings_json:String
    designation: Designations
  }
  type FoldersPath {
    id: ID
    path: String
    folder_name:String
  }
  type Designations {
    id: ID
    name: String
  }
  type Mod_Details {
    id: ID
    fileId: ID
    userId: ID
    username: String
    transcriptionText: String
    updatedAt:String
  }
  type QueryStatus {
    success: Boolean
    error: String
    result: String
  }
  type Quick_Search_Ids {
    ids: [ID]
    searchText:String!
  }
  type Query {
    get_designations: [Designations]
    get_user(user_id: ID!): User
    get_users: [User]
    get_folders_path: [FoldersPath]
    force_folder_to_refresh_all:QueryStatus
    get_folders_files_from_path(folderPath: String!):[Files]
    get_folders_files_from_folder_id(folderId: String!):FilesData
    get_folders_files_from_folder_id_with_notify(folderId: String!,notify:Boolean!):FilesDataWithNotify
    get_folders_files_from_folder_id_db_filter(folderId: String!,searchText: String!,startDate: String!, endDate: String!):FilesDataArchive
    get_folders_db_filter(folderIds: [String]!,searchText: String!,startDate: String!, endDate: String!):FilesDataArchive
    get_today_files(folderId: String!):[Files]
    get_transcription(fileId: String!):QueryStatus
    get_last_mod_detail(fileId: String!):Mod_Details
    get_mod_detail_by_file_id(fileId: String!):[Mod_Details]
    get_ids_for_quick_search(folderId: ID!,searchText:String! ,startDate: String, endDate: String):Quick_Search_Ids
    get_users_download_history(searchText: String!,startDate: String!, endDate: String!,userId: ID):[FilesDetailsDownloadHistory]
    get_users_view_history(userId: ID!,fileId: ID!):[ViewHistory]
    get_files_full_details_by_id_for_export(filesIds:[String]):[FilesExport]
    get_file_full_details_by_id(fileId:String):Files
  }

  type Mutation {
    login(username: String!, password: String!): User
   
    check_email_user_exist(email: String!): QueryStatus
    update_user(
      user_id: ID!
      name: String!
      avatar: String
      email: String
      country_code: String
      contact_no: String
      status: StatusType!
      block_comments: String
      role: RoleType!
      username: String!
      password: String
      settings_json:String
      designation_id: Int
    ): QueryStatus
    update_loggedin_user(
      loggedin_id: ID!
      name: String!
      avatar: String
      email: String
      username: String!
      country_code: String
      contact_no: String
      new_password: String
      current_password: String
    ): QueryStatus
    add_user(
      name: String!
      avatar: String
      email: String
      country_code: String
      contact_no: String
      status: StatusType!
      block_comments: String
      role: RoleType!
      username: String!
      password: String
      settings_json:String
      designation_id: Int
    ): QueryStatus
    delete_user(user_id: ID!): QueryStatus

    update_designation(designation_id: ID!, name: String!): QueryStatus
    add_designation(name: String!): QueryStatus
    delete_designation(designation_id: ID!): QueryStatus

    update_folder_path(folder_path_id: ID!, path: String!, folder_name: String! ): QueryStatus
    add_folder_path(path: String!,folder_name: String!): QueryStatus
    delete_folder_path(folder_path_id: ID!): QueryStatus


    add_files_in_files(files: [FileInput]):[Files]
    update_files_deleted_in_files(files: [FileDeleteInput]):QueryStatus
    update_more_info_and_preview(files: [FileUpdateInput]):QueryStatus
    update_transcription( folderId: ID!, fileId: ID!, userId: ID!, username: String!, transcriptionHTML:String!):QueryStatus
    add_download_history(userId:ID!, fileId: ID!):QueryStatus
    add_or_update_view_history(userId:ID!, fileId: ID!):QueryStatus
  }
`;
